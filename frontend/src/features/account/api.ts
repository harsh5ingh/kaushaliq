import type { MessageKey } from '../../app/i18n/config';
const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/,'') || '/api';
export class AccountError extends Error {
  readonly key:MessageKey;
  constructor(code:string) {
    super(code);
    this.key = code==='rate_limited' ? 'auth.rateLimit' : code==='email_not_configured' ? 'personal.emailMissing' : code==='email_temporarily_unavailable' ? 'personal.emailUnavailable' : code.startsWith('phone_') ? 'personal.smsMissing' : code==='verification_invalid' ? 'personal.codeInvalid' : code==='verification_cooldown' ? 'personal.cooldown' : code==='credentials_invalid' ? 'personal.passwordError' : code==='password_policy' ? 'personal.passwordPolicy' : code.startsWith('resume_') ? 'personal.fileError' : 'personal.error';
  }
}
export async function accountRequest<T>(path:string, csrf:string, method='GET', body?:unknown, file?:File):Promise<T> {
  const response=await fetch(base+path,{method,credentials:'include',headers:{Accept:'application/json', ...(method==='GET'?{}:{'X-CSRF-Token':csrf}), ...(file?{'Content-Type':file.type,'X-File-Name':encodeURIComponent(file.name)}:body!==undefined?{'Content-Type':'application/json'}:{})}, ...(file?{body:file}:body!==undefined?{body:JSON.stringify(body)}:{})});
  const payload:unknown=await response.json().catch(()=>null);
  if(response.status===401 && path.startsWith('/v1/me')) window.dispatchEvent(new Event('kaushaliq:session-invalid'));
  if(!response.ok) throw new AccountError(response.status===429 && !(typeof payload==='object' && payload && 'detail' in payload && payload.detail==='verification_cooldown')?'rate_limited':typeof payload==='object' && payload && 'detail' in payload && typeof payload.detail==='string'?payload.detail:'request_failed');
  return payload as T;
}
export const resumeDownload = base+'/v1/me/resume/download';
