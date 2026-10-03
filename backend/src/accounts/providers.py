"""Provider adapters return bounded, sanitized results; production has no mock selector."""
import hashlib
import json
import re
from dataclasses import dataclass
from typing import Literal, Protocol
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from src.config import settings


@dataclass(frozen=True)
class ProviderResult:
    status: Literal['accepted', 'rejected', 'configuration_error', 'provider_error', 'network_error']
    error_code: str = ''
    message_id: str = ''

    @property
    def state(self):
        return 'CONFIGURED' if self.status == 'accepted' else 'NOT_CONFIGURED' if self.error_code == 'not_configured' else 'TEMPORARILY_UNAVAILABLE'


class ProviderUnavailable(Exception):
    def __init__(self, state='TEMPORARILY_UNAVAILABLE', result=None):
        self.state = state
        self.result = result or ProviderResult('configuration_error' if state == 'NOT_CONFIGURED' else 'provider_error', 'not_configured' if state == 'NOT_CONFIGURED' else 'provider_error')
        super().__init__('Verification delivery unavailable')

    @property
    def code(self):
        return 'email_not_configured' if self.result.error_code == 'not_configured' else 'email_provider_' + self.result.error_code


class EmailProvider(Protocol):
    def send(self, target: str, subject: str, text: str) -> ProviderResult: ...


class SmsProvider(Protocol):
    def send(self, target: str, text: str) -> ProviderResult: ...


def _identifier(value):
    # Only a canonical UUID is emitted unchanged. Other opaque IDs are fingerprints.
    if not isinstance(value, str) or not value: return ''
    if re.fullmatch(r'[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}', value): return value
    return 'sha256:' + hashlib.sha256(value.encode()).hexdigest()[:24]


def _error(status, payload):
    name = payload.get('name', payload.get('code', '')) if isinstance(payload, dict) else ''
    name = name if isinstance(name, str) else ''
    message = str(payload.get('message', ''))[:2048].lower() if isinstance(payload, dict) else ''
    if status == 401 or name in {'invalid_api_key', 'missing_api_key', 'restricted_api_key', 'suspended_api_key', 'invalid_permission', 'unauthorized'}:
        return ProviderResult('configuration_error', 'auth_failed')
    if 'own email' in message or 'testing emails' in message:
        return ProviderResult('rejected', 'test_recipient_restricted')
    if 'verify a domain' in message or 'domain is not verified' in message or 'verified domain' in message:
        return ProviderResult('configuration_error', 'sender_unverified')
    if status in {400, 422}:
        return ProviderResult('configuration_error', 'invalid_sender_or_request')
    if status == 429: return ProviderResult('provider_error', 'rate_limited')
    if status in {402, 403}: return ProviderResult('rejected', 'rejected')
    return ProviderResult('provider_error', 'provider_error')


def _body(response):
    data = response.read(16385)
    if len(data) > 16384: return {}
    try:
        value = json.loads(data)
        return value if isinstance(value, dict) else {}
    except (ValueError, UnicodeError): return {}


def post(url, body, headers):
    try:
        request = Request(url, data=json.dumps(body).encode(), headers={'Content-Type': 'application/json', 'Accept': 'application/json', 'User-Agent': 'KaushalIQ/0.1 verification', **headers}, method='POST')
        with urlopen(request, timeout=12) as response:
            payload = _body(response)
            if not 200 <= response.status < 300: return _error(response.status, payload)
            identifier = _identifier(payload.get('id') or payload.get('messageId'))
            if not identifier: return ProviderResult('provider_error', 'invalid_response')
            return ProviderResult('accepted', message_id=identifier)
    except HTTPError as exc:
        try: return _error(exc.code, _body(exc))
        finally: exc.close()
    except (TimeoutError, URLError, OSError): return ProviderResult('network_error', 'network_error')
    except Exception:
        # Never emit upstream exception/body/header text.
        return ProviderResult('provider_error', 'provider_error')


class ResendEmailProvider:
    def send(self, target, subject, text):
        return post('https://api.resend.com/emails', {'from': f'{settings.email_from_name} <{settings.email_from}>', 'to': [target], 'subject': subject, 'text': text}, {'Authorization': f'Bearer {settings.email_api_key}'})


class BrevoEmailProvider:
    def send(self, target, subject, text):
        return post('https://api.brevo.com/v3/smtp/email', {'sender': {'name': settings.email_from_name, 'email': settings.email_from}, 'to': [{'email': target}], 'subject': subject, 'textContent': text}, {'api-key': settings.email_api_key})


class BrevoSmsProvider:
    def send(self, target, text):
        return post('https://api.brevo.com/v3/transactionalSMS/send', {'sender': settings.sms_sender_id, 'recipient': target, 'content': text, 'type': 'transactional'}, {'api-key': settings.sms_api_key})


def email_provider() -> EmailProvider:
    selected = {'resend': ResendEmailProvider, 'brevo': BrevoEmailProvider}.get(settings.email_provider.lower())
    if not selected or not settings.email_api_key or not settings.email_from: raise ProviderUnavailable('NOT_CONFIGURED')
    if not re.fullmatch(r'[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+', settings.email_from) or any(c in settings.email_from_name for c in '\r\n<>'):
        raise ProviderUnavailable(result=ProviderResult('configuration_error', 'invalid_sender_or_request'))
    return selected()


def sms_provider() -> SmsProvider:
    if settings.sms_provider.lower() != 'brevo' or not settings.sms_api_key or not settings.sms_sender_id: raise ProviderUnavailable('NOT_CONFIGURED')
    return BrevoSmsProvider()
