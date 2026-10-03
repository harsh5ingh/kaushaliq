"""Allowlisted authentication diagnostics. Never accept payloads, addresses or secrets."""
import json
import logging
import re

logger = logging.getLogger('kaushaliq.auth')
if not logger.handlers:
    logger.addHandler(logging.StreamHandler())
logger.setLevel(logging.INFO)
logger.propagate = False


def event(name, **fields):
    allowed = {'provider', 'recipient_domain', 'status', 'error_code', 'provider_message_id', 'purpose'}
    clean = {'event': name}
    for key, value in fields.items():
        if key in allowed and isinstance(value, str) and re.fullmatch(r'[A-Za-z0-9_.:-]{1,253}', value):
            clean[key] = value
    logger.info(json.dumps(clean, sort_keys=True))
