import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLocale } from '../../hooks/usePreferences';
import type { MessageKey } from '../../app/i18n/locales/en-IN';
import { ErrorState,LoadingState,EmptyState } from '../../components/ui/States';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EvidencePanel } from '../real-intelligence/EvidencePanel';
import { useForecast } from './useForecast';
import { HistoryVisualization } from './HistoryVisualization';
import type { Family,Point } from './contracts';
import type { Source } from '../real-intelligence/contracts';

const reasonKeys:Record<string,MessageKey>={
  OBSERVATIONS_REQUIRED:'forecast.OBSERVATIONS_REQUIRED',ANNUAL_FREQUENCY_REQUIRED:'forecast.ANNUAL_FREQUENCY_REQUIRED',INSUFFICIENT_HISTORY:'forecast.historyRequirement',
  INCOMPATIBLE_SERIES:'forecast.compatibilityRequirement',MISSING_PERIODS:'forecast.missingRequirement',QUALITY_RESTRICTION:'forecast.qualityRequirement',
  GEOGRAPHY_UNMAPPED:'forecast.GEOGRAPHY_UNMAPPED',METHODOLOGY_BOUNDARY:'forecast.METHODOLOGY_BOUNDARY',UNCERTAINTY_UNSUPPORTED:'forecast.UNCERTAINTY_UNSUPPORTED',
};
const metricKeys:Record<string,MessageKey>={LFPR:'real.LFPR',WPR:'real.WPR',UR:'real.UR',active_vacancies:'demand.vacancies',TRAINED:'supply.TRAINED',CERTIFIED:'supply.CERTIFIED',TRAINING_CENTRES:'supply.TRAINING_CENTRES'};
export function ForecastIntelligence(){
  const {t,locale}=useLocale(),[params,setParams]=useSearchParams();
  const family=(params.get('family')||'labour') as Family,metric=params.get('metric')||(family==='labour'?'LFPR':family==='demand'?'active_vacancies':'TRAINED');
  const geography=params.get('region')||'in',horizon=Number(params.get('horizon')||1);
  const query=new URLSearchParams({family,metric,geography_id:geography,...(family==='labour'?{sex:params.get('sex')||'persons',sector:params.get('sector')||'combined',activity_status:params.get('activity')||'US'}:{})}).toString();
  const {history,forecast,coverage,failed,retry}=useForecast(query,horizon);
  const [selectedId,setSelectedId]=useState(''),[evidence,setEvidence]=useState<{point:Point;source?:Source;geographyName:string}|null>(null);
  function change(key:string,value:string){const next=new URLSearchParams(params);next.set(key,value);if(key==='family'){next.delete('metric');next.delete('region');}if(key==='metric')next.delete('region');setParams(next);}
  const group=coverage?.families.find(f=>f.family===family);
  const h=history?.items[0],f=forecast?.items[0],s=h?.series,latest=s?.observations.at(-1),selected=s?.observations.find(p=>p.observation_id===selectedId)??latest;
  const latestChange=h?.changes.find(c=>c.to_id===latest?.observation_id);
  const nf=new Intl.NumberFormat(locale,{maximumFractionDigits:s?.unit==='percent'?1:0}),df=new Intl.NumberFormat(locale,{maximumFractionDigits:2,signDisplay:'exceptZero'});
  const unit=s?.unit==='percent'?'%':s?.unit==='persons'?t('forecast.persons'):s?.unit==='centres'?t('forecast.centres'):t('forecast.vacancies');
  const source=coverage?.sources.find(x=>x.source_id===latest?.source_id);
  return <section className="forecast-intelligence" data-query={query}>
    <header className="forecast-header real-section-heading"><p className="section-kicker">{t('real.banner')} · {t('forecast.gate')}</p><h2>{t('forecast.title')}</h2><p>{t('forecast.intro')}</p></header>
    {coverage&&<div className="real-filter-bar forecast-filters">
      <label>{t('forecast.family')}<select aria-label={t('forecast.family')} value={family} onChange={e=>change('family',e.target.value)}>{coverage.families.map(f=><option key={f.family} value={f.family}>{t(`forecast.${f.family}`)}</option>)}</select></label>
      <label>{t('forecast.metric')}<select aria-label={t('forecast.metric')} value={metric} onChange={e=>change('metric',e.target.value)}>{group?.metrics.map(m=><option key={m} value={m}>{metricKeys[m]?t(metricKeys[m]):m}</option>)}</select></label>
      <label>{t('real.region')}<select aria-label={t('real.region')} value={geography} onChange={e=>change('region',e.target.value)}>{group?.geographies.filter(g=>g.metrics.includes(metric)).map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
      {family==='labour'&&<>
        <label>{t('real.sex')}<select aria-label={t('real.sex')} value={params.get('sex')||'persons'} onChange={e=>change('sex',e.target.value)}>{(['persons','female','male'] as const).map(v=><option key={v} value={v}>{t(`real.${v}`)}</option>)}</select></label>
        <label>{t('real.sector')}<select aria-label={t('real.sector')} value={params.get('sector')||'combined'} onChange={e=>change('sector',e.target.value)}>{(['combined','rural','urban'] as const).map(v=><option key={v} value={v}>{t(`real.${v}`)}</option>)}</select></label>
        <label>{t('real.activity')}<select aria-label={t('real.activity')} value={params.get('activity')||'US'} onChange={e=>change('activity',e.target.value)}>{(['US','CWS'] as const).map(v=><option key={v} value={v}>{t(`real.${v}`)}</option>)}</select></label>
      </>}
      <label>{t('forecast.horizon')}<select aria-label={t('forecast.horizon')} value={horizon} onChange={e=>change('horizon',e.target.value)}>{[1,2,3].map(n=><option key={n} value={n}>{n} {t('forecast.years')}</option>)}</select></label>
    </div>}
    {failed?<ErrorState description={t('forecast.error')} onRetry={retry}/>:!history||!forecast||!coverage?<LoadingState label={t('forecast.loading')}/>:!s||!h||!f||!latest||!selected?<><EmptyState title={t('forecast.empty')} description={t('forecast.emptyDetail')}/><button type="button" className="real-evidence-link" onClick={()=>setParams({})}>{t('forecast.reset')}</button></>:<>
      <div className="forecast-summary">
        <article className="real-metric"><p>{t('forecast.latest')} · {latest.period}{latest.partial?' · '+t('forecast.partial'):''}</p><strong>{nf.format(latest.value)}{s.unit==='percent'?'%':''}</strong><p>{metricKeys[s.metric]?t(metricKeys[s.metric]):s.metric} · {s.unit==='percent'?t(s.metric==='UR'?'real.forceDenominator':'real.popDenominator'):unit}</p><StatusBadge kind="observed"/><small className="viz-metric-context">{s.geography_name} · {source?.publisher}</small></article>
        <article className="forecast-delta"><p>{t('forecast.change')}</p>{latestChange?.absolute_change!=null?<><strong>{df.format(latestChange.absolute_change)} <small>{s.unit==='percent'?t('forecast.pp'):unit}</small></strong><StatusBadge kind="derived"/><p>{latestChange.from_period} → {latestChange.to_period}</p>{latestChange.growth_percent!=null&&<p>{t('forecast.growth')}: {df.format(latestChange.growth_percent)}%</p>}</>:<p>{t('forecast.noChange')}</p>}</article>
        <article className="forecast-readiness-card"><p>{t('forecast.gate')}</p><strong>{t(`forecast.${f.readiness.status}` as MessageKey)}</strong><StatusBadge kind={f.status==='FORECAST'?'forecast':'unavailable'}/><p>{t('forecast.readinessNote')}</p></article>
      </div>
      <HistoryVisualization history={h} forecast={f} selected={selected} onSelect={setSelectedId} onEvidence={point=>setEvidence({point,source:coverage.sources.find(source=>source.source_id===point.source_id),geographyName:s.geography_name})}/>
      <section className="forecast-gate"><div><p className="section-kicker">{t('forecast.gate')} · {f.readiness.policy_version}</p><h2>{t(f.status==='FORECAST'?'forecast.ready':'forecast.unavailable')}</h2><p>{t('forecast.readinessNote')}</p></div>
        <div><h3>{t('forecast.requirements')}</h3><ul>{f.readiness.reason_codes.map(code=><li key={code}>{t(reasonKeys[code]??'forecast.unknownReason')}</li>)}</ul></div>
        <details><summary>{t('forecast.gate')} · {f.readiness.checks.length}</summary><ul className="forecast-checks">{f.readiness.checks.map(c=><li key={c.code}><span aria-hidden="true">{c.passed?'✓':'—'}</span><span>{t(reasonKeys[c.code]??'forecast.unknownReason')} <small>{t(c.passed?'forecast.READY':'forecast.UNAVAILABLE')}</small></span></li>)}</ul></details>
      </section>
      <section className="forecast-backtest"><header><h2>{t('forecast.backtest')}</h2><p>{t('forecast.backtestNote')}</p></header>
        {f.backtest.status==='AVAILABLE'?<><dl className="forecast-errors">{(['mae','rmse','bias'] as const).map(k=><div key={k}><dt>{t(`forecast.${k}`)}</dt><dd>{new Intl.NumberFormat(locale,{maximumFractionDigits:3}).format(f.backtest[k]!)} <small>{s.unit==='percent'?t('forecast.pp'):unit}</small></dd></div>)}</dl>
        <details><summary>{t('forecast.folds')} · {f.backtest.folds.length}</summary><div className="real-table-wrap" tabIndex={0} role="region" aria-label={t('forecast.folds')}><table><caption>{t('forecast.model')} · {f.model_version}</caption><thead><tr><th>{t('real.period')}</th><th>{t('forecast.observed')}</th><th>{t('forecast.predicted')}</th><th>{t('forecast.errorValue')}</th></tr></thead><tbody>{f.backtest.folds.map(b=><tr key={b.target_id}><th scope="row">{b.target_period}</th><td>{nf.format(b.observed)}</td><td>{nf.format(b.predicted)}</td><td>{df.format(b.error)}</td></tr>)}</tbody></table></div></details></>:<p>{t('forecast.noBacktest')}</p>}
      </section>
      <details className="forecast-method"><summary>{t('forecast.method')}</summary><p>{t('forecast.modelMethod')}</p><p>{t('forecast.uncertainty')}</p><p>{s.family==='labour'?t('forecast.boundary'):s.family==='supply'?t('forecast.trainingNote'):t('forecast.stockNote')}</p>
        {s.applicability_evidence_url&&<a href={s.applicability_evidence_url} target="_blank" rel="noreferrer">{t('real.methodology')} · MoSPI</a>}
        <p>{t('forecast.missing')}: {s.missing_periods.join(' · ')||t('forecast.noMissing')}</p>
        <p>{t('forecast.updated')}: {source?.retrieved_at?new Intl.DateTimeFormat(locale,{dateStyle:'medium'}).format(new Date(source.retrieved_at)):'—'}</p>
        {f.generated_at&&<p>{t('forecast.generated')}: {new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short'}).format(new Date(f.generated_at))}</p>}
      </details>
      <section className="forecast-coverage"><h3>{t('forecast.coverage')}</h3><p><strong>{coverage.series_count}</strong> {t('forecast.series')} · <strong>{coverage.historical_series_count}</strong> {t('forecast.historySeries')} · <strong>{coverage.forecast_ready_count}</strong> {t('forecast.readySeries')}</p><p>{t('forecast.noDimensions')}</p></section>
    </>}
    {evidence&&<EvidencePanel evidence={evidence.point.evidence} source={evidence.source} period={`${evidence.point.period} · ${evidence.geographyName}`} onClose={()=>setEvidence(null)}/>}
  </section>;
}
