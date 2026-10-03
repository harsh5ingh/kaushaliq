import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../../app/providers/authContext';
import { useLocale } from '../../hooks/usePreferences';
import { Button } from '../../components/ui/Buttons';
import { AuthField } from '../../components/auth/AuthField';
import { PasswordStrength } from '../../components/auth/PasswordStrength';
import { validPassword } from './passwordPolicy';
import { accountRequest, AccountError } from './api';
import type { AccountSession, Verification } from './contracts';
import type { MessageKey } from '../../app/i18n/config';
import { Modal } from '../../components/ui/Modal';
import { LoadingState } from '../../components/ui/States';
import { Loader } from '../../components/ui/Loader';

export function PasswordSettings(){
  const {t}=useLocale();const {csrf,user}=useAuth();const [current,setCurrent]=useState('');const [password,setPassword]=useState('');const [confirm,setConfirm]=useState('');const [busy,setBusy]=useState(false);const [message,setMessage]=useState<MessageKey|null>(null);
  async function submit(e:FormEvent){e.preventDefault();setMessage(null);if(!validPassword(password)){setMessage('personal.passwordPolicy');return;}if(password!==confirm){setMessage('auth.passwordMismatch');return;}setBusy(true);try{await accountRequest('/v1/me/change-password',csrf,'POST',{current_password:current,new_password:password});setCurrent('');setPassword('');setConfirm('');setMessage('personal.passwordChanged');}catch(e){setMessage(e instanceof AccountError?e.key:'personal.error');}finally{setBusy(false);}}
  if (user?.passwordEnabled === false) return <section className="personal-section"><h2>{t('personal.passwordChange')}</h2><p>{t('security.providerOnly')}</p></section>;
  return <section className="personal-section"><h2>{t('personal.passwordChange')}</h2><form onSubmit={submit}>
    <AuthField label={t('personal.currentPassword')} type="password" value={current} onChange={e=>setCurrent(e.target.value)} autoComplete="current-password" required disabled={busy}/><AuthField label={t('personal.newPassword')} type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" required disabled={busy}/><PasswordStrength password={password}/><AuthField label={t('auth.confirm')} type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} autoComplete="new-password" required disabled={busy} error={confirm&&confirm!==password?t('auth.passwordMismatch'):undefined}/><Button type="submit" pending={busy}>{t('personal.passwordChange')}</Button>{message&&<p role={message==='personal.passwordChanged'?'status':'alert'}>{t(message)}</p>}</form></section>;
}

export function SessionSettings(){
  const {t,locale}=useLocale(); const {csrf,signOutEverywhere}=useAuth();
  const [sessions,setSessions]=useState<AccountSession[]>([]);
  const [loading,setLoading]=useState(true); const [busy,setBusy]=useState(false);
  const [confirmOpen,setConfirmOpen]=useState(false); const [message,setMessage]=useState<MessageKey|null>(null);
  const inFlight=useRef(false);
  const refresh=useCallback(async()=>{const result=await accountRequest<{items:AccountSession[]}>('/v1/me/sessions',csrf);setSessions(result.items);},[csrf]);
  useEffect(()=>{let active=true;accountRequest<{items:AccountSession[]}>('/v1/me/sessions',csrf).then(r=>{if(active)setSessions(r.items);}).catch(()=>{if(active)setMessage('personal.error');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[csrf]);
  async function revoke(kind:'others'|'all'|'one',id?:string){
    if(inFlight.current)return;inFlight.current=true;setBusy(true);setMessage(null);
    try {
      if(kind==='all'){await signOutEverywhere();return;}
      await accountRequest('/v1/me/sessions/'+(kind==='one'?id:'revoke-others'),csrf,kind==='one'?'DELETE':'POST');
      setConfirmOpen(false);
      try { await refresh();setMessage('security.othersSignedOut'); }
      catch {setMessage('security.refreshFailed');}
    } catch {setMessage('security.revokeFailed');}
    finally {inFlight.current=false;setBusy(false);}
  }
  const failure=message!==null && message!=='security.othersSignedOut';
  return <section className="personal-section"><h2>{t('personal.sessions')}</h2>
    {loading?<LoadingState/>:<ul className="session-list">{sessions.map(session=><li key={session.id}><div><strong>{t(session.current?'personal.currentSession':'personal.otherSession')}</strong><small>{t('personal.expires',{date:new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short'}).format(new Date(session.expires_at))})}</small></div>{!session.current&&<Button variant="quiet" pending={busy} onClick={()=>void revoke('one',session.id)}>{t('personal.revoke')}</Button>}</li>)}</ul>}
    <Button variant="secondary" disabled={loading} pending={busy} onClick={()=>{setMessage(null);setConfirmOpen(true);}}>{t('personal.revokeOthers')}</Button>
    {message&&!confirmOpen&&<p role={failure?'alert':'status'}>{t(message)}</p>}
    {(message==='personal.error'||message==='security.refreshFailed')&&<Button variant="quiet" onClick={()=>void refresh().then(()=>setMessage(null)).catch(()=>setMessage('personal.error'))}>{t('security.refresh')}</Button>}
    {confirmOpen&&<Modal title={t('security.confirmTitle')} id="session-confirm-title" descriptionId="session-confirm-description" className="session-confirmation" onClose={()=>{if(!inFlight.current)setConfirmOpen(false);}}>
      <p id="session-confirm-description">{t('security.confirmDescription')}</p>
      <div className="session-confirm-actions">
        <Button pending={busy} onClick={()=>void revoke('others')}>{t('security.keepDevice')}</Button>
        <Button variant="destructive" pending={busy} onClick={()=>void revoke('all')}>{t('security.everywhere')}</Button>
        <Button variant="quiet" disabled={busy} data-initial-focus onClick={()=>setConfirmOpen(false)}>{t('security.cancel')}</Button>
      </div>
      {busy&&<p className="progress-label" role="status"><Loader/>{t('auth.checking')}</p>}
      {message&&<p role="alert">{t(message)}</p>}
    </Modal>}
  </section>;
}

export function ContactVerification({purpose}:{purpose:'email'|'phone'}){
  const {t}=useLocale();const {csrf,refreshUser,user}=useAuth();const [target,setTarget]=useState('');const [password,setPassword]=useState('');const [code,setCode]=useState('');const [sent,setSent]=useState<Verification|null>(null);const [busy,setBusy]=useState(false);const [message,setMessage]=useState<MessageKey|null>(null);const [remaining,setRemaining]=useState(0);const [available,setAvailable]=useState<boolean|null>(null);
  useEffect(()=>{let active=true;accountRequest<{email:string;sms:string}>('/auth/verification/providers',csrf).then(v=>{if(active)setAvailable(v[purpose==='email'?'email':'sms']==='CONFIGURED');}).catch(()=>{if(active)setAvailable(false);});return()=>{active=false;};},[csrf,purpose]);
  useEffect(()=>{if(remaining<=0)return;const timer=setTimeout(()=>setRemaining(n=>n-1),1000);return()=>clearTimeout(timer);},[remaining]);
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setMessage(null);try{if(sent){await accountRequest('/v1/me/verify-'+purpose,csrf,'POST',{code});setSent(null);setPassword('');setCode('');setTarget('');await refreshUser();setMessage('personal.saved');}else{const result=await accountRequest<Verification>('/v1/me/change-'+purpose,csrf,'POST',{target,current_password:password});setSent(result);setRemaining(result.cooldown_seconds);}}catch(e){setMessage(e instanceof AccountError?e.key:'personal.error');}finally{setBusy(false);}}
  if (user?.passwordEnabled === false) return <section className="personal-section"><h2>{t(purpose==='email'?'personal.emailChange':'personal.phoneChange')}</h2><p>{t('security.providerOnly')}</p></section>;
  return <section className="personal-section"><h2>{t(purpose==='email'?'personal.emailChange':'personal.phoneChange')}</h2>{available===false && <p role="status">{t(purpose==='email'?'personal.emailMissing':'personal.smsMissing')}</p>}<form onSubmit={submit}>{sent?<><p>{t('personal.masked',{target:sent.masked_target})}</p><label>{t('personal.code')}<input inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}/></label></>:<><label>{t('personal.target')}<input type={purpose==='email'?'email':'tel'} autoComplete={purpose==='email'?'email':'tel'} value={target} onChange={e=>setTarget(e.target.value)} required/></label>{purpose==='phone'&&<p>{t('personal.phoneHint')}</p>}<AuthField label={t('personal.currentPassword')} type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></>}
    <Button type="submit" pending={busy} disabled={!sent && available!==true}>{t(sent?'personal.verify':'personal.sendCode')}</Button>{sent&&<Button variant="quiet" disabled={remaining>0} onClick={()=>{setSent(null);setCode('');}}>{remaining>0?t('personal.resendIn',{seconds:remaining}):t('personal.resend')}</Button>}{message&&<p role={message==='personal.saved'?'status':'alert'}>{t(message)}</p>}</form></section>;
}
