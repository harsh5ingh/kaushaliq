import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../hooks/usePreferences';
import { ProductPreferences } from '../components/navigation/ProductPreferences';
import { usePersonalProfile } from '../features/account/usePersonalProfile';
import { PasswordSettings,SessionSettings,ContactVerification } from '../features/account/SecuritySettings';
import { accountRequest } from '../features/account/api';
import type { ProfileSections } from '../features/account/contracts';
import { Button } from '../components/ui/Buttons';

function AlertPreferences({initial,csrf}:{initial:ProfileSections['alerts'];csrf:string}){const {t}=useLocale();const [draft,setDraft]=useState(initial);const [busy,setBusy]=useState(false);const [status,setStatus]=useState<'saved'|'error'|null>(null);async function save(){setBusy(true);try{await accountRequest('/v1/me/sections/alerts',csrf,'PUT',draft);setStatus('saved');}catch{setStatus('error');}finally{setBusy(false);}}return <section className="personal-section"><h2>{t('personal.notifications')}</h2><p>{t('personal.alertNote')}</p><fieldset className="choice-list"><legend className="sr-only">{t('personal.notifications')}</legend>{(Object.keys(draft) as (keyof typeof draft)[]).map(key=><label key={key}><input type="checkbox" checked={draft[key]} onChange={e=>setDraft({...draft,[key]:e.target.checked})}/>{t(`personal.alert.${key}`)}</label>)}</fieldset><Button pending={busy} onClick={()=>void save()}>{t('personal.save')}</Button>{status&&<p role={status==='saved'?'status':'alert'}>{t(status==='saved'?'personal.saved':'personal.error')}</p>}</section>;}
export function PersonalSettingsPage(){
 const {t}=useLocale();const {profile,error,csrf}=usePersonalProfile();if(error)return <p role="alert">{t('personal.error')}</p>;
 return <div className="personal-page"><section className="personal-section account-settings"><h2>{t('account.preferences')}</h2><ProductPreferences/><Link to="/profile">{t('personal.profile')}</Link></section><div className="profile-sections"><ContactVerification purpose="email"/><ContactVerification purpose="phone"/><PasswordSettings/><SessionSettings/></div><section className="personal-section"><h2>{t('personal.connected')}</h2>{['Google','GitHub'].map(provider=><p key={provider}>{t('personal.providerUnavailable',{provider})}</p>)}</section>{profile&&<AlertPreferences initial={profile.sections.alerts} csrf={csrf}/>}</div>;
}
