import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa6';
import { useAuth } from '../../app/providers/authContext';
import { useLocale } from '../../hooks/usePreferences';
import { Button } from '../../components/ui/Buttons';
import { LoadingState } from '../../components/ui/States';
import { accountRequest, AccountError } from './api';
import { oauthError, type OAuthProvider } from './oauth';
import type { MessageKey } from '../../app/i18n/config';

export function ConnectedAccounts() {
  const {t}=useLocale();const {csrf}=useAuth();const location=useLocation();
  const [items,setItems]=useState<{provider:OAuthProvider;state:string;connected:boolean}[]|null>(null);
  const [pending,setPending]=useState<OAuthProvider|null>(null); const inFlight=useRef(false);
  const [error,setError]=useState<MessageKey|null>(null);
  const callbackError=new URLSearchParams(location.search).get('oauth_error');
  useEffect(()=>{let active=true;accountRequest<{items:NonNullable<typeof items>}>('/v1/me/connected-accounts',csrf).then(r=>{if(active)setItems(r.items);}).catch(e=>{if(active)setError(e instanceof AccountError?e.key:'personal.error');});return()=>{active=false;};},[csrf]);
  async function connect(provider:OAuthProvider){
    if(inFlight.current)return;inFlight.current=true;setPending(provider);setError(null);
    try {const result=await accountRequest<{authorizationUrl:string}>('/v1/me/connected-accounts/'+provider,csrf,'POST');window.location.assign(result.authorizationUrl);}
    catch(e){setError(e instanceof AccountError?e.key:'oauth.failed');setPending(null);inFlight.current=false;}
  }
  return <section className="personal-section"><h2>{t('personal.connected')}</h2>
    {!items&&!error&&<LoadingState/>}
    <div className="connected-provider-list">{items?.map(item=>{const name=item.provider==='google'?'Google':'GitHub';return <div key={item.provider} className="connected-provider">
      {item.provider==='google'?<FcGoogle size={20} aria-hidden="true"/>:<FaGithub size={20} aria-hidden="true"/>}
      <div><strong>{name}</strong><p>{t(item.connected?'oauth.connected':item.state==='CONFIGURED'?'oauth.configured':item.state==='NOT_CONFIGURED'?'personal.providerUnavailable':'oauth.unavailable',{provider:name})}</p></div>
      {!item.connected&&<Button variant="secondary" pending={pending===item.provider} disabled={pending!==null || item.state!=='CONFIGURED'} onClick={()=>void connect(item.provider)}>{t('oauth.connect',{provider:name})}</Button>}
    </div>;})}</div>
    {(error||callbackError)&&<p role="alert">{t(error??oauthError(callbackError!))}</p>}
  </section>;
}
