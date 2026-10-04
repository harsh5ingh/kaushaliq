import {useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {useLocale} from '../../hooks/usePreferences';
import type {MessageKey} from '../../app/i18n/config';
import {ErrorState,LoadingState} from '../../components/ui/States';
import {PrimaryButton} from '../../components/ui/Buttons';
import {EvidencePanel} from '../real-intelligence/EvidencePanel';
import type {EvidenceSelection} from '../early-warning/WarningDetail';
import {contextLabel,metricLabel,stateLabel,unitLabel} from '../phase5/labels';
import {useScenario} from './useScenario';
import type {AssumptionKind,BaselineOption,ScenarioType} from './contracts';
import {ScenarioResult} from './ScenarioResult';

export function ScenarioIntelligence(){const {t,locale}=useLocale(),[params,setParams]=useSearchParams(),[mode,setMode]=useState<ScenarioType>('SKILL_SHOCK'),[kind,setKind]=useState<AssumptionKind>('AI_ADOPTION'),[change,setChange]=useState('30'),[seriesId,setSeriesId]=useState(''),[evidence,setEvidence]=useState<EvidenceSelection|null>(null);
  const geography=params.get('geography_id')??'in',family=params.get('family')??'',offset=params.get('offset')??'0',query=new URLSearchParams({geography_id:geography,...(family?{family}:{}),limit:'100',offset}).toString();const {coverage,failed,pending,result,runFailed,execute,clear,retry}=useScenario(query),nf=new Intl.NumberFormat(locale,{maximumFractionDigits:2});
  function invalidate(){clear();setEvidence(null);}
  function filter(key:string,value:string){invalidate();setSeriesId('');const next=new URLSearchParams(params);if(value)next.set(key,value);else next.delete(key);if(key!=='offset')next.delete('offset');setParams(next);}
  function label(b:BaselineOption){return `${metricLabel(t,b.metric)} · ${b.period} · ${contextLabel(t,b.classification)||t(`forecast.${b.family}`)}`;}
  if(failed)return <ErrorState description={t('scenario.error')} onRetry={retry}/>;
  if(!coverage)return <LoadingState label={t('scenario.loading')}/>;
  const selected=coverage.baseline_options.find(b=>b.series_id===seriesId)??coverage.baseline_options[0],valid=change.trim()!==''&&Number.isFinite(Number(change))&&Number(change)>=-100&&Number(change)<=1000;
  const requestedKind:AssumptionKind=mode==='DIRECT_METRIC_SENSITIVITY'?'DIRECT_METRIC_CHANGE':kind;
  return <section className="scenario-intelligence phase5-intelligence" data-ready="true">
    <header className="real-section-heading phase5-heading"><h2>{t('scenario.setup')}</h2><p>{t('scenario.setupNote')}</p></header>
    <p className="scenario-disclosure phase5-disclosure" role="note">{t('scenario.simulation')}</p>
    <div className="scenario-workspace"><form className="scenario-form" onSubmit={e=>{e.preventDefault();if(valid&&selected)void execute({scenario_type:mode,series_id:selected.series_id,assumption:{kind:requestedKind,change_percent:Number(change)}});}}>
      <label>{t('scenario.mode')}<select aria-label={t('scenario.mode')} value={mode} onChange={e=>{invalidate();setMode(e.target.value as ScenarioType);}}><option value="SKILL_SHOCK">{t('scenario.SKILL_SHOCK')}</option><option value="DIRECT_METRIC_SENSITIVITY">{t('scenario.DIRECT_METRIC_SENSITIVITY')}</option></select></label>
      <p className="scenario-method-note">{t(mode==='SKILL_SHOCK'?'scenario.shockNote':'scenario.directNote')}</p>
      <div className="scenario-controls">{mode==='SKILL_SHOCK'&&<label>{t('scenario.technology')}<select aria-label={t('scenario.technology')} value={kind} onChange={e=>{invalidate();setKind(e.target.value as AssumptionKind);}}>{(['AI_ADOPTION','AUTOMATION','SECTOR_EXPANSION'] as const).map(k=><option key={k} value={k}>{t(`scenario.${k}`)}</option>)}</select></label>}<label>{t('scenario.change')}<input aria-label={t('scenario.change')} aria-invalid={!valid} aria-describedby={!valid?'scenario-input-error':undefined} type="number" min={-100} max={1000} step="any" required value={change} onChange={e=>{invalidate();setChange(e.target.value);}}/></label><label>{t('scenario.region')}<select aria-label={t('scenario.region')} value={geography} onChange={e=>filter('geography_id',e.target.value)}>{coverage.geographies.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label><label>{t('scenario.family')}<select aria-label={t('scenario.family')} value={family} onChange={e=>filter('family',e.target.value)}><option value="">{t('scenario.allFamilies')}</option>{(['labour','demand','supply'] as const).map(f=><option key={f} value={f}>{t(`forecast.${f}`)}</option>)}</select></label></div>
      {!valid&&<p id="scenario-input-error" role="alert">{t('scenario.invalid')}</p>}
      <label className="scenario-baseline-choice">{t('scenario.baseline')}<select aria-label={t('scenario.baseline')} disabled={!selected} value={selected?.series_id??''} onChange={e=>{invalidate();setSeriesId(e.target.value);}}>{!selected&&<option value="">{t('scenario.noBaseline')}</option>}{coverage.baseline_options.map(b=><option key={b.series_id} value={b.series_id}>{label(b)}</option>)}</select></label>
      {selected&&<div className="scenario-baseline-preview"><p>{metricLabel(t,selected.metric)} · <span lang="en">{selected.geography_name}</span> · {selected.period}</p><strong>{nf.format(selected.value)} <small>{unitLabel(t,selected.unit)}</small></strong><span>{t('real.observed')}</span><p>{t('scenario.baselineNote')}</p></div>}
      {!selected&&<div className="phase5-gate"><h3>{t('scenario.noBaseline')}</h3><p>{t('scenario.BASELINE_UNAVAILABLE')}</p></div>}
      {coverage.baseline_total>100&&<div className="phase5-pagination"><button type="button" className="button button-secondary" disabled={Number(offset)===0} onClick={()=>filter('offset',String(Math.max(0,Number(offset)-100)))}>{t('phase5.previous')}</button><button type="button" className="button button-secondary" disabled={Number(offset)+coverage.baseline_options.length>=coverage.baseline_total} onClick={()=>filter('offset',String(Number(offset)+100))}>{t('phase5.next')}</button></div>}
      <PrimaryButton type="submit" disabled={!valid||!selected} pending={pending}>{t(pending?'scenario.running':'scenario.run')}</PrimaryButton>
    </form><aside className="scenario-readiness" aria-labelledby="scenario-readiness-heading"><h3 id="scenario-readiness-heading">{t('scenario.readiness')}</h3>{coverage.scenario_types.map(c=><div key={c.scenario_type}><p>{t(`scenario.${c.scenario_type}`)}</p><span className={`phase5-state ${c.status==='READY'?'is-ready':''}`}>{stateLabel(t,c.status)}</span>{c.reason_codes.length>0&&<ul>{c.reason_codes.map(code=><li key={code}>{t(`scenario.${code}` as MessageKey)}</li>)}</ul>}</div>)}<p>{t('scenario.relationshipNote')}</p></aside></div>
    {pending?<LoadingState label={t('scenario.running')}/>:runFailed?<ErrorState description={t('scenario.error')} onRetry={()=>{if(valid&&selected)void execute({scenario_type:mode,series_id:selected.series_id,assumption:{kind:requestedKind,change_percent:Number(change)}});}}/>:result?<ScenarioResult result={result} onEvidence={setEvidence}/>:<p className="scenario-pending" role="status">{t('scenario.pending')}</p>}
    {evidence&&<EvidencePanel {...evidence} onClose={()=>setEvidence(null)}/>}
  </section>;
}
