import {useRef,useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {useLocale} from '../../hooks/usePreferences';
import {ErrorState,LoadingState,EmptyState} from '../../components/ui/States';
import {SecondaryButton} from '../../components/ui/Buttons';
import {EvidencePanel} from '../real-intelligence/EvidencePanel';
import {contextLabel,metricLabel} from '../phase5/labels';
import {useEarlyWarning} from './useEarlyWarning';
import {WarningDetail,type EvidenceSelection} from './WarningDetail';
import {WarningReadiness} from './WarningReadiness';

export function EarlyWarningIntelligence(){
  const {t,locale}=useLocale(),[params,setParams]=useSearchParams(),[selected,setSelected]=useState(''),[evidence,setEvidence]=useState<EvidenceSelection|null>(null);
  const detail=useRef<HTMLDivElement>(null);const filters=new URLSearchParams([...params].filter(([k,v])=>['signal_type','geography_id','severity','series_id','offset'].includes(k)&&v));filters.set('limit','25');
  const query=filters.toString(),{data,coverage,failed,retry}=useEarlyWarning(query),nf=new Intl.NumberFormat(locale,{maximumFractionDigits:2,signDisplay:'exceptZero'});
  function change(key:string,value:string){const next=new URLSearchParams(params);if(value)next.set(key,value);else next.delete(key);if(key!=='offset')next.delete('offset');setParams(next);setSelected('');setEvidence(null);}
  if(failed)return <ErrorState description={t('warning.error')} onRetry={retry}/>;
  if(!data||!coverage)return <LoadingState label={t('warning.loading')}/>;
  const chosen=data.items.find(w=>w.signal_id===selected)??data.items[0];
  function inspect(id:string){setSelected(id);requestAnimationFrame(()=>{detail.current?.focus();detail.current?.scrollIntoView({block:'start',behavior:'instant'});});}
  return <section className="early-warning-intelligence phase5-intelligence" data-ready="true" data-query={query}>
    <header className="real-section-heading phase5-heading"><p className="section-kicker">{t('real.banner')} · {t('warning.historical')}</p><h2>{t('warning.title')}</h2><p>{t('warning.intro')}</p></header>
    <div className="real-filter-bar phase5-filters"><label>{t('warning.signalType')}<select aria-label={t('warning.signalType')} value={params.get('signal_type')??''} onChange={e=>change('signal_type',e.target.value)}><option value="">{t('warning.all')}</option>{coverage.options.signal_types.map(type=><option key={type} value={type}>{t(`warning.${type}`)}</option>)}</select></label><label>{t('real.region')}<select aria-label={t('real.region')} value={params.get('geography_id')??''} onChange={e=>change('geography_id',e.target.value)}><option value="">{t('gap.allRegions')}</option>{coverage.options.geographies.map(g=><option key={g.geography_id} value={g.geography_id??''}>{g.geography_name}</option>)}</select></label><label>{t('warning.severity')}<select aria-label={t('warning.severity')} value={params.get('severity')??''} onChange={e=>change('severity',e.target.value)}><option value="">{t('warning.allSeverity')}</option><option value="REVIEW">{t('warning.REVIEW')}</option><option value="INFO">{t('warning.INFO')}</option></select></label><SecondaryButton onClick={()=>{setParams({});setSelected('');setEvidence(null);}}>{t('warning.reset')}</SecondaryButton></div>
    <div className="phase5-summary"><div><span>{t('warning.signals')}</span><strong>{new Intl.NumberFormat(locale).format(data.total)}</strong></div><div><span>{t('warning.dimensions')}</span><strong>{coverage.active_signal_types.length}</strong></div><div><span>{t('warning.ruleVersion')}</span><strong className="phase5-version" lang="en">{data.engine_version}</strong></div></div>
    {!data.items.length?<section className="warning-unavailable phase5-gate"><EmptyState title={t('warning.none')} description={t(data.total>0?'warning.noPage':data.status==='EMPTY'&&data.readiness.some(r=>r.status==='READY')?'warning.noTrigger':'warning.noneDetail')}/><div className="phase5-actions"><a href="#warning-readiness" className="button button-secondary">{t('warning.coverage')}</a><a href="#warning-methodology" className="button button-quiet">{t('warning.method')}</a></div></section>:<>
      <div className="real-table-wrap warning-list" tabIndex={0} role="region" aria-label={t('warning.list')}><table><caption>{t('warning.list')}</caption><thead><tr><th>{t('warning.signal')}</th><th>{t('warning.entity')}</th><th>{t('real.region')}</th><th>{t('real.period')}</th><th>{t('warning.change')}</th><th>{t('warning.severity')}</th></tr></thead><tbody>{data.items.map((w,i)=><tr key={w.signal_id} className={w.signal_id===chosen?.signal_id?'is-selected':''}><th scope="row"><button className="warning-inspect" type="button" aria-pressed={w.signal_id===chosen?.signal_id} onClick={()=>inspect(w.signal_id)} aria-label={`${t('warning.select')} ${i+1}: ${t(`warning.${w.signal_type}`)}`}>{t(`warning.${w.signal_type}`)}</button></th><td>{metricLabel(t,w.observed_values.at(-1)?.identity.metric??w.entity_name)}<small>{contextLabel(t,w.observed_values.at(-1)?.identity??{})}</small></td><td lang="en">{w.geography.geography_name}</td><td>{w.period}</td><td>{w.derived_metrics.absolute_change===null?'—':`${nf.format(w.derived_metrics.absolute_change)} ${w.derived_metrics.change_unit==='percentage points'?t('phase5.pp'):w.derived_metrics.change_unit}`}</td><td><span className={`phase5-state ${w.severity==='REVIEW'?'is-review':''}`}>{t(`warning.${w.severity}`)}</span></td></tr>)}</tbody></table></div>
      <div className="phase5-pagination"><span>{data.items.length} / {data.total} {t('phase5.records')}</span><SecondaryButton disabled={!Number(params.get('offset')??0)} onClick={()=>change('offset',String(Math.max(0,Number(params.get('offset')??0)-25)))}>{t('phase5.previous')}</SecondaryButton><SecondaryButton disabled={Number(params.get('offset')??0)+data.items.length>=data.total} onClick={()=>change('offset',String(Number(params.get('offset')??0)+25))}>{t('phase5.next')}</SecondaryButton></div>
      {chosen&&<div ref={detail} tabIndex={-1}><WarningDetail warning={chosen} sources={data.sources} onEvidence={setEvidence}/></div>}
    </>}
    <WarningReadiness items={data.readiness}/>
    <details className="phase5-method" id="warning-methodology"><summary>{t('warning.method')}</summary><p>{t('warning.methodNote')}</p><p>{t('warning.qualificationNote')}</p><p>{t('warning.limitNote')}</p><details><summary>{t('phase5.technical')}</summary><ul lang="en">{coverage.limitations.map((l,i)=><li key={i}>{l}</li>)}</ul></details></details>
    {evidence&&<EvidencePanel {...evidence} onClose={()=>setEvidence(null)}/>}
  </section>;
}
