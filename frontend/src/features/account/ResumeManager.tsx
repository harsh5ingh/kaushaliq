import { useState } from 'react';
import { useAuth } from '../../app/providers/authContext';
import { useLocale } from '../../hooks/usePreferences';
import { Button } from '../../components/ui/Buttons';
import { accountRequest, AccountError, resumeDownload } from './api';
import type { Resume } from './contracts';
import type { MessageKey } from '../../app/i18n/config';

export function ResumeManager({resume,reload}:{resume:Resume|null;reload:()=>Promise<void>}) {
  const {t,locale}=useLocale();const {csrf}=useAuth();const [busy,setBusy]=useState(false);const [message,setMessage]=useState<MessageKey|null>(null);
  const [skills,setSkills]=useState<string[]>([]);const [degree,setDegree]=useState('');const [experience,setExperience]=useState<string[]>([]);
  const [candidateSkills,setCandidateSkills]=useState(resume?.candidates.skills||[]);const [candidateExperience,setCandidateExperience]=useState(resume?.candidates.experience||[]);
  async function action(path:string,method:string,body?:unknown,file?:File){setBusy(true);setMessage(null);try{await accountRequest('/v1/me/resume'+path,csrf,method,body,file);await reload();setSkills([]);setDegree('');setExperience([]);setMessage('personal.saved');}catch(e){setMessage(e instanceof AccountError?e.key:'personal.error');}finally{setBusy(false);}}
  return <section className="personal-section resume-manager"><h2>{t('personal.resume')}</h2><p>{t('personal.resumeNote')}</p><label className="file-label">{t('personal.upload')}<input type="file" accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={busy} onChange={e=>{const file=e.target.files?.[0];if(file)void action('','POST',undefined,file);e.target.value='';}}/></label>
    {resume && <><div className="resume-summary"><strong>{resume.filename}</strong><span>{t('personal.uploaded',{date:new Intl.DateTimeFormat(locale).format(new Date(resume.uploaded_at))})}</span><a className="button button-secondary" href={resumeDownload}>{t('personal.download')}</a><Button variant="destructive" pending={busy} onClick={()=>void action('','DELETE')}>{t('personal.deleteResume')}</Button></div>
      <h3>{t('personal.candidates')}</h3><p>{t('personal.candidateNote')}</p>{!resume.candidates.text_available && <p role="status">{t('personal.noText')}</p>}
      {!resume.candidates.skills.length && !resume.candidates.education.length && !resume.candidates.experience.length && <p>{t('personal.noCandidates')}</p>}
      <fieldset className="choice-list"><legend>{t('personal.skills')}</legend>{candidateSkills.map((name,index)=><div className="candidate-row" key={index}><label><input type="checkbox" checked={skills.includes(name)} onChange={()=>setSkills(skills.includes(name)?skills.filter(v=>v!==name):[...skills,name])}/><span className="sr-only">{t('personal.skills')} · {name}</span></label><input aria-label={t('personal.skills')+' '+(index+1)} maxLength={100} value={name} onChange={e=>{const next=e.target.value;setCandidateSkills(candidateSkills.map((v,i)=>i===index?next:v));setSkills(skills.map(v=>v===name?next:v));}}/><Button variant="quiet" aria-label={t('personal.remove',{name})} onClick={()=>{setCandidateSkills(candidateSkills.filter((_,i)=>i!==index));setSkills(skills.filter(v=>v!==name));}}>×</Button></div>)}</fieldset>
      {resume.candidates.education.length>0 && <label>{t('personal.degree')}<input maxLength={120} value={degree} placeholder={resume.candidates.education[0]} onChange={e=>setDegree(e.target.value)}/></label>}
      <fieldset className="choice-list"><legend>{t('personal.experience')}</legend>{candidateExperience.map((name,index)=><div className="candidate-row" key={index}><label><input type="checkbox" checked={experience.includes(name)} onChange={()=>setExperience(experience.includes(name)?experience.filter(v=>v!==name):[...experience,name])}/><span className="sr-only">{t('personal.experience')} · {name}</span></label><input aria-label={t('personal.experience')+' '+(index+1)} maxLength={120} value={name} onChange={e=>{const next=e.target.value;setCandidateExperience(candidateExperience.map((v,i)=>i===index?next:v));setExperience(experience.map(v=>v===name?next:v));}}/><Button variant="quiet" aria-label={t('personal.remove',{name})} onClick={()=>{setCandidateExperience(candidateExperience.filter((_,i)=>i!==index));setExperience(experience.filter(v=>v!==name));}}>×</Button></div>)}</fieldset>
      <Button variant="secondary" pending={busy} disabled={!skills.length&&!degree.trim()&&!experience.length} onClick={()=>void action('/confirm','POST',{resume_id:resume.id,skills,degree,experience})}>{t('personal.confirmResume')}</Button></>}
    {message && <p role={message==='personal.saved'?'status':'alert'}>{t(message)}</p>}
  </section>;
}
