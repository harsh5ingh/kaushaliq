from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, ConfigDict, Field
from urllib.parse import urlencode
from src.accounts import oauth
from src.config import settings
from src.routes.auth import current_session, issue_session, rate_limit, validate_csrf

router = APIRouter(prefix='/api/auth/oauth', tags=['authentication'])


class Start(BaseModel):
    model_config = ConfigDict(extra='forbid')
    return_to: str = Field(default='/intelligence', max_length=1500)


@router.post('/{provider}/start')
def start(provider: str, body: Start, request: Request, response: Response):
    validate_csrf(request)
    rate_limit(request, 'oauth-start:' + provider)
    return oauth.begin_flow(provider, response, body.return_to)


@router.post('/{provider}/link')
def link(provider: str, request: Request, response: Response, session=Depends(current_session)):
    # Explicit provider consent belongs to OAuth, not direct connected-account mutation.
    user, _ = session
    validate_csrf(request)
    rate_limit(request, user['id'] + ':provider')
    if provider not in oauth.PROVIDERS:
        raise HTTPException(404, 'not_found')
    return oauth.begin_flow(provider, response, '/settings', user)


@router.get('/{provider}/callback')
def callback(provider: str, request: Request):
    if provider not in oauth.PROVIDERS:
        raise HTTPException(404, 'not_found')
    flow = None
    response = None
    try:
        # Multiple code/state/error parameters are not accepted.
        for key in ('state', 'code', 'error'):
            if len(request.query_params.getlist(key)) > 1:
                raise oauth.OAuthFailure('oauth_state_invalid')
        flow = oauth.consume_flow(provider, request.query_params.get('state', ''), request.cookies.get(oauth.cookie_name(provider), ''))
        if request.query_params.get('error'):
            raise oauth.OAuthFailure('oauth_cancelled')
        identity = oauth.exchange_identity(provider, request.query_params.get('code', ''), flow)
        user = oauth.resolve_identity(provider, identity, flow)
        destination = oauth.safe_return(flow['return_to'])
        if flow['user_id']:
            separator = '&' if '?' in destination else '?'
            destination += separator + urlencode({'oauth_connected': provider})
        response = RedirectResponse(settings.frontend_url.rstrip('/') + destination, status_code=303)
        if not flow['user_id']:
            issue_session(response, user, provider)
    except oauth.OAuthFailure as exc:
        route = '/settings' if flow and flow['user_id'] else '/auth/signin'
        response = RedirectResponse(settings.frontend_url.rstrip('/') + route + '?' + urlencode({'oauth_error': exc.code}), status_code=303)
    except HTTPException:
        response = RedirectResponse(settings.frontend_url.rstrip('/') + '/auth/signin?oauth_error=oauth_identity_invalid', status_code=303)
    response.delete_cookie(oauth.cookie_name(provider), path='/', httponly=True,
                           secure=settings.environment.lower() == 'production', samesite='lax')
    response.headers['Referrer-Policy'] = 'no-referrer'
    return response
