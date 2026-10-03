"""Isolated browser-test process, never imported by runtime src or enabled through env."""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from provider_server import app
from src.accounts import oauth
from src.config import settings
import uvicorn

if settings.environment.lower() != 'development':
    raise RuntimeError('Test OAuth forbidden outside development')
settings.api_url = settings.frontend_url
for provider in oauth.PROVIDERS:
    setattr(settings, provider + '_client_id', 'isolated-test-client')
    setattr(settings, provider + '_client_secret', 'isolated-test-secret')
    setattr(settings, provider + '_callback_url', settings.frontend_url + f'/api/auth/oauth/{provider}/callback')


def fixture_identity(provider, code, flow):
    if code == 'missing-email': raise oauth.OAuthFailure('oauth_email_unverified')
    if code == 'provider-failed': raise oauth.OAuthFailure('oauth_provider_failed')
    if code != 'test-success': raise oauth.OAuthFailure('oauth_identity_invalid')
    return oauth.Identity('isolated-' + provider, provider + '-test@example.in', 'OAuth Test Account')


oauth.exchange_identity = fixture_identity
if __name__ == '__main__':
    uvicorn.run(app, host='127.0.0.1', port=int(sys.argv[1]), log_level='error', access_log=False)
