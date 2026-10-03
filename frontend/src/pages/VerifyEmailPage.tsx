import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/providers/authContext';
import { useLocale } from '../hooks/usePreferences';
import { accountRequest, AccountError } from '../features/account/api';
import type { Verification } from '../features/account/contracts';
import { Brand } from '../components/navigation/Brand';
import { ProductPreferences } from '../components/navigation/ProductPreferences';
import { Button } from '../components/ui/Buttons';
import type { MessageKey } from '../app/i18n/config';

export function VerifyEmailPage() {
  const {t}=useLocale(); const auth=useAuth(); const navigate=useNavigate(); const [verification,setVerification]=useState(auth.pending);
  const [code,setCode]=useState(''); const [countdown,setCountdown]=useState(auth.pending?.cooldown_seconds||0); const [busy,setBusy]=useState(false); const [error,setError]=useState<MessageKey|null>(null);
  // Confirmation owns the onboarding/return-to redirect; existing sessions skip this form.
  const confirming=useRef(false);
  useEffect(()=>{if(auth.user && !confirming.current)navigate('/my-intelligence',{replace:true});},[auth.user,navigate]);
  useEffect(()=>{accountRequest<Verification>('/auth/verification',auth.csrf).then(v=>{setVerification(v);setCountdown(v.cooldown_seconds);}).catch(e=>setError(e instanceof AccountError?e.key:'personal.networkError'));},[auth.csrf]);
  useEffect(()=>{if(countdown<=0)return; const timer=setTimeout(()=>setCountdown(n=>n-1),1000);return()=>clearTimeout(timer);},[countdown]);
  async function action(resend=false){setBusy(true);setError(null);try{if(resend){const result=await accountRequest<Verification>('/auth/verification/resend',auth.csrf,'POST');setVerification(result);setCountdown(result.cooldown_seconds);}else {confirming.current=true;await auth.verifyEmail(code);}}catch(e){if(!resend)confirming.current=false;setError(e instanceof AccountError?e.key:'personal.error');}finally{setBusy(false);}}
  function submit(e:FormEvent){e.preventDefault();if(/^\d{6}$/.test(code))void action();else setError('personal.codeInvalid');}
  return <div className="auth-screen"><header className="auth-screen-header"><Brand/><ProductPreferences/></header><main className="verification-surface"><p className="eyebrow">KaushalIQ</p><h1>{t('personal.checkEmail')}</h1>
    {!verification?<p role="status">{t(error||'personal.loading')}</p>:verification.state==='CONFIGURED'?<p>{t('personal.masked',{target:verification.masked_target})}</p>:<p role="status">{t(verification?.error_code?new AccountError(verification.error_code).key:verification?.state==='TEMPORARILY_UNAVAILABLE'?'personal.emailUnavailable':'personal.emailMissing')}</p>}
    <form onSubmit={submit}><label htmlFor="email-code">{t('personal.code')}</label><input id="email-code" className="otp-input" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))} disabled={busy} aria-describedby="verification-message"/>
      <Button type="submit" pending={busy} disabled={verification?.state!=='CONFIGURED'}>{t('personal.verify')}</Button></form>
    <Button variant="quiet" pending={busy} disabled={countdown>0 || !verification} onClick={()=>void action(true)}>{countdown>0?t('personal.resendIn',{seconds:countdown}):t('personal.resend')}</Button>
    <p id="verification-message" role={error?'alert':'status'}>{error?t(error):t('personal.verifyNote')}</p><div className="personal-actions"><Link to="/auth/signup">{t('personal.changeEmail')}</Link><Link to="/intelligence">{t('personal.public')}</Link></div></main></div>;
}
