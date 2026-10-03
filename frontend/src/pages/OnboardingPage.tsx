import { personalSections } from "../features/account/config";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../hooks/usePreferences';
import { usePersonalProfile } from '../features/account/usePersonalProfile';
import { ProfileEditor } from '../features/account/ProfileEditor';
import { ResumeManager } from '../features/account/ResumeManager';
import { accountRequest } from '../features/account/api';
import { Button } from '../components/ui/Buttons';

export function OnboardingPage(){
  const {t}=useLocale();const {profile,error,reload,csrf}=usePersonalProfile();const navigate=useNavigate();const [busy,setBusy]=useState(false);const [failed,setFailed]=useState(false);
  if(error)return <p role="alert">{t('personal.error')}</p>;if(!profile)return <p role="status">{t('personal.loading')}</p>;
  const step=profile.sections.onboarding.step;
  async function move(next:number,status='in_progress',exit=false){setBusy(true);setFailed(false);try{await accountRequest('/v1/me/sections/onboarding',csrf,'PUT',{step:next,status});if(exit)navigate('/my-intelligence');else await reload();return true;}catch{setFailed(true);return false;}finally{setBusy(false);}}
  const section=personalSections[step];
  return <section className="onboarding-surface"><p className="eyebrow">{t('personal.step',{step:step+1})}</p><progress max={7} value={step+1} aria-label={t('personal.onboard')}/><h2>{section?t(`personal.${section}`):t(step===5?'personal.resume':'personal.done')}</h2><p>{t('personal.optional')}</p>
    {section && <ProfileEditor key={step} section={section} initial={profile.sections} onboarding onSaved={async()=>{if(!await move(step+1))throw new Error('onboarding_save_failed');}}/>}
    {step===5 && <><ResumeManager key={profile.resume?.id||'empty'} resume={profile.resume} reload={reload}/><Button pending={busy} onClick={()=>void move(6)}>{t('personal.continue')}</Button></>}
    {step===6 && <><p>{t('personal.doneNote')}</p><Button pending={busy} onClick={()=>void move(6,'complete',true)}>{t('personal.finish')}</Button></>}
    <div className="personal-actions">{step>0 && <Button variant="quiet" pending={busy} onClick={()=>void move(step-1)}>{t('personal.back')}</Button>}{step<6 && <Button variant="quiet" pending={busy} onClick={()=>void move(step+1)}>{t('personal.skip')}</Button>}<Button variant="quiet" pending={busy} onClick={()=>void move(step,step===0?'skipped':'in_progress',true)}>{t('personal.exit')}</Button></div>{failed && <p role="alert">{t('personal.error')}</p>}
  </section>;
}
