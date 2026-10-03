"""Provider selection is centralized; test doubles exist only in tests via DI."""
import json
from typing import Protocol
from urllib.request import Request, urlopen
from src.config import settings


class ProviderUnavailable(Exception):
    def __init__(self, state='TEMPORARILY_UNAVAILABLE'):
        self.state = state


class EmailProvider(Protocol):
    def send(self, target: str, subject: str, text: str) -> None: ...


class SmsProvider(Protocol):
    def send(self, target: str, text: str) -> None: ...


def post(url, body, headers):
    try:
        request = Request(url, data=json.dumps(body).encode(), headers={'Content-Type': 'application/json', **headers}, method='POST')
        with urlopen(request, timeout=12) as response:
            if not 200 <= response.status < 300: raise ProviderUnavailable()
    except Exception:
        # Never propagate upstream bodies, headers, addresses or credentials into logs/API.
        raise ProviderUnavailable() from None


class ResendEmailProvider:
    def send(self, target, subject, text):
        post('https://api.resend.com/emails', {'from': f'{settings.email_from_name} <{settings.email_from}>', 'to': [target], 'subject': subject, 'text': text}, {'Authorization': f'Bearer {settings.email_api_key}'})


class BrevoEmailProvider:
    def send(self, target, subject, text):
        post('https://api.brevo.com/v3/smtp/email', {'sender': {'name': settings.email_from_name, 'email': settings.email_from}, 'to': [{'email': target}], 'subject': subject, 'textContent': text}, {'api-key': settings.email_api_key})


class BrevoSmsProvider:
    def send(self, target, text):
        post('https://api.brevo.com/v3/transactionalSMS/send', {'sender': settings.sms_sender_id, 'recipient': target, 'content': text, 'type': 'transactional'}, {'api-key': settings.sms_api_key})


def email_provider() -> EmailProvider:
    implementations = {'resend': ResendEmailProvider, 'brevo': BrevoEmailProvider}
    selected = implementations.get(settings.email_provider.lower())
    if not selected or not settings.email_api_key or not settings.email_from:
        raise ProviderUnavailable('NOT_CONFIGURED')
    return selected()


def sms_provider() -> SmsProvider:
    if settings.sms_provider.lower() != 'brevo' or not settings.sms_api_key or not settings.sms_sender_id:
        raise ProviderUnavailable('NOT_CONFIGURED')
    return BrevoSmsProvider()
