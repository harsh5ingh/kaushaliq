import { personalSections } from "../features/account/config";
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../app/providers/authContext';
import { useLocale } from '../hooks/usePreferences';
import { usePersonalProfile } from '../features/account/usePersonalProfile';
import { ProfileEditor } from '../features/account/ProfileEditor';
import { ResumeManager } from '../features/account/ResumeManager';
import { accountRequest } from '../features/account/api';
import { Button } from '../components/ui/Buttons';

export function PersonalProfilePage() {
  const {t}=useLocale(); const {refreshUser}=useAuth();const {profile,error,reload,csrf}=usePersonalProfile();const [busy,setBusy]=useState(false);const [status,setStatus]=useState<'saved'|'error'|null>(null);
  async function saveName(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setStatus(null);try{await accountRequest('/v1/me/profile',csrf,'PATCH',{name:new FormData(e.currentTarget).get('name')});await Promise.all([reload(),refreshUser()]);setStatus('saved');}catch{setStatus('error');}finally{setBusy(false);}}
  if(error)return <p role="alert">{t('personal.error')}</p>;if(!profile)return <p role="status">{t('personal.loading')}</p>;
  return <div className="personal-page"><div className="personal-context"><p>{t('personal.private')}</p><strong>{t('personal.completion',{count:profile.completion.completed.length,total:profile.completion.total})}</strong><progress aria-label={t('personal.complete')} max={profile.completion.total} value={profile.completion.completed.length}/><Link to="/onboarding">{t('personal.onboard')}</Link></div>
    <section className="personal-section"><h2>{t('personal.name')}</h2><form onSubmit={saveName}><label>{t('auth.name')}<input name="name" defaultValue={profile.user.name} maxLength={80} required autoComplete="name"/></label><dl><div><dt>{t('auth.email')}</dt><dd>{profile.user.email}</dd></div>{profile.phone_masked && <div><dt>{t('personal.phoneChange')}</dt><dd>{profile.phone_masked}</dd></div>}</dl><Link to="/settings">{t('personal.emailChange')}</Link><div className="personal-actions"><Button type="submit" pending={busy}>{t('personal.save')}</Button>{status && <p role={status==='error'?'alert':'status'}>{t(status==='saved'?'personal.saved':'personal.error')}</p>}</div></form></section>
    <div className="profile-sections">{personalSections.map(section=><section className="personal-section" key={section}><ProfileEditor key={JSON.stringify(profile.sections[section])} section={section} initial={profile.sections} onSaved={reload}/></section>)}</div>
    {profile.sections.experience.length>0 && <section className="personal-section"><ProfileEditor key={JSON.stringify(profile.sections.experience)} section="experience" initial={profile.sections} onSaved={reload}/></section>}
    <ResumeManager key={profile.resume?.id||'empty'} resume={profile.resume} reload={reload}/>
  </div>;
}
