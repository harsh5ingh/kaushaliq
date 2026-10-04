import type { MessageKey } from '../../app/i18n/config';
import { oauthError } from './oauth';
const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/,'') || '/api';
export class AccountError extends Error {
  readonly key:MessageKey;
  constructor(code:string) {
    super(code);
    if (code.startsWith('oauth_')) { this.key = oauthError(code); return; }
    this.key = code==='rate_limited' ? 'auth.rateLimit' : code==='email_not_configured' ? 'personal.emailMissing' : code==='email_provider_auth_failed' ? 'personal.emailAuthFailed' : code==='email_provider_sender_unverified' || code==='email_provider_invalid_sender_or_request' ? 'personal.emailSenderFailed' : code==='email_provider_test_recipient_restricted' ? 'personal.emailTestRestricted' : code==='email_provider_rejected' ? 'personal.emailRejected' : code==='email_provider_network_error' || code==='network_error' ? 'personal.networkError' : code.startsWith('email_provider_') || code==='email_temporarily_unavailable' ? 'personal.emailUnavailable' : code.startsWith('phone_') ? 'personal.smsMissing' : code==='verification_expired' ? 'personal.codeExpired' : code==='verification_max_attempts' ? 'personal.codeExhausted' : code==='verification_invalid' ? 'personal.codeInvalid' : code==='verification_cooldown' ? 'personal.cooldown' : code==='credentials_invalid' ? 'personal.passwordError' : code==='password_policy' ? 'personal.passwordPolicy' : code.startsWith('resume_') ? 'personal.fileError' : 'personal.error';
  }
}
export async function accountRequest<T>(path:string, csrf:string, method='GET', body?:unknown, file?:File):Promise<T> {
  let response:Response;
  try { response=await fetch(base+path,{method,credentials:'include',headers:{Accept:'application/json', ...(method==='GET'?{}:{'X-CSRF-Token':csrf}), ...(file?{'Content-Type':file.type,'X-File-Name':encodeURIComponent(file.name)}:body!==undefined?{'Content-Type':'application/json'}:{})}, ...(file?{body:file}:body!==undefined?{body:JSON.stringify(body)}:{})});
  } catch { throw new AccountError('network_error'); }
  const payload:unknown=await response.json().catch(()=>null);
  if(response.status===401 && (path.startsWith('/v1/me') || /^\/auth\/oauth\/(google|github)\/link$/.test(path))) window.dispatchEvent(new Event('kaushaliq:session-invalid'));
  if(!response.ok) throw new AccountError(response.status===429 && !(typeof payload==='object' && payload && 'detail' in payload && payload.detail==='verification_cooldown')?'rate_limited':typeof payload==='object' && payload && 'detail' in payload && typeof payload.detail==='string'?payload.detail:'request_failed');
  return payload as T;
}
export const resumeDownload = base+'/v1/me/resume/download';
