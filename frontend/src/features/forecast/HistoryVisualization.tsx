import { Area,CartesianGrid,ComposedChart,ErrorBar,Line,ResponsiveContainer,Tooltip,XAxis,YAxis } from 'recharts';
import { useLocale } from '../../hooks/usePreferences';
import { VisualizationFrame } from '../../components/visualization/VisualizationFrame';
import { ObservationTimeline } from './ObservationTimeline';
import type { Forecast,Point,Trend } from './contracts';
export function HistoryVisualization({history,forecast,selected,onSelect,onEvidence}:{history:Trend;forecast:Forecast;selected:Point;onSelect:(id:string)=>void;onEvidence:(point:Point)=>void}){
  const {t,locale}=useLocale(),s=history.series,nf=new Intl.NumberFormat(locale,{maximumFractionDigits:s.unit==='percent'?1:0});
  const format=(v:number)=>nf.format(v)+(s.unit==='percent'?'%':'');
  let segment=0;const segments=new Set<number>();
  const data:Record<string,unknown>[]=s.observations.map((p,i)=>{if(i>0&&history.changes[i-1]?.status!=='DERIVED')segment++;segments.add(segment);return {period:p.period,point:p,[`segment${segment}`]:p.value,forecast_value:i===s.observations.length-1&&forecast.status==='FORECAST'?p.value:null};});
  if(forecast.status==='FORECAST')forecast.forecasts.forEach(p=>data.push({period:p.period,projection:p,forecast_value:p.value,interval:[p.lower,p.upper],interval_error:[p.value-p.lower,p.upper-p.value]}));
  return <VisualizationFrame title={t('forecast.history')} description={t('forecast.historyNote')} source={s.source_ids.join(' · ')} period={`${s.observations[0].period} → ${s.observations[s.observations.length-1].period}`} annotation={s.family==='labour'?t('forecast.boundary'):s.family==='supply'?t('forecast.trainingNote'):t('forecast.stockNote')}>
    <div className="viz-trend-layout"><div className="real-chart" role="group" aria-label={`${t('forecast.history')} · ${s.geography_name} · ${s.metric}`}>
      <p className="forecast-legend"><span className="forecast-observed-key" aria-hidden="true" />{t('forecast.observed')}{forecast.status==='FORECAST'&&<><span className="forecast-model-key" aria-hidden="true" />{t('forecast.modelOutput')} · {t('forecast.interval')}</>}</p>
      <ResponsiveContainer width="100%" height={300}><ComposedChart accessibilityLayer data={data} margin={{left:0,right:12,top:16,bottom:8}}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} strokeDasharray="2 6" />
        <XAxis dataKey="period" stroke="var(--chart-axis)" tick={{fontSize:12}} tickLine={false} axisLine={false} minTickGap={30} />
        <YAxis domain={s.unit==='percent'?[0,100]:[0,'auto']} tickFormatter={v=>new Intl.NumberFormat(locale,{notation:'compact',maximumFractionDigits:1}).format(Number(v))} unit={s.unit==='percent'?'%':undefined} stroke="var(--chart-axis)" tick={{fontSize:12}} width={55} tickLine={false} axisLine={false} />
        <Tooltip content={({active,payload})=>{const row=payload?.[0]?.payload as {point?:Point;projection?:Forecast['forecasts'][number]}|undefined;const p=row?.point??row?.projection;return active&&p?<div className="real-tooltip"><p>{p.period} · {s.geography_name}</p><strong>{format(p.value)}</strong><p>{'observation_id' in p?s.source_ids.join(' · ')+' · '+t('forecast.observed'):t('forecast.modelOutput')}</p>{'lower' in p&&<p>{t('forecast.interval')}: {format(p.lower)}–{format(p.upper)}</p>}</div>:null;}} />
        {[...segments].map(n=><Line key={n} type="linear" dataKey={`segment${n}`} stroke="var(--chart-series-1)" strokeWidth={2.5} dot={{r:4,fill:'var(--bg-surface)',strokeWidth:2}} activeDot={{r:6}} isAnimationActive={false} connectNulls={false} />)}
        {forecast.status==='FORECAST'&&<><Area type="linear" dataKey="interval" stroke="none" fill="var(--accent-fill)" fillOpacity={.12} isAnimationActive={false} connectNulls={false}/><Line type="linear" dataKey="forecast_value" stroke="var(--accent-text)" strokeDasharray="5 4" dot={{r:4}} isAnimationActive={false} connectNulls={false}><ErrorBar dataKey="interval_error" direction="y" stroke="var(--accent-text)" width={5}/></Line></>}
      </ComposedChart></ResponsiveContainer>
      <ObservationTimeline points={s.observations} selected={selected} onSelect={onSelect} />
    </div><aside className="viz-inspector">
      <label>{t('forecast.periodSelect')}<select aria-label={t('forecast.periodSelect')} value={selected.observation_id} onChange={e=>onSelect(e.target.value)}>{s.observations.map(p=><option key={p.observation_id} value={p.observation_id}>{p.period}{p.partial?' · '+t('forecast.partial'):''}</option>)}</select></label>
      <p>{t('forecast.observed')}{selected.partial?' · '+t('forecast.partial'):''}</p><strong>{format(selected.value)}</strong><p>{s.geography_name} · {selected.period}</p>
      <button type="button" className="real-evidence-link" onClick={()=>onEvidence(selected)}>{t('real.evidence')}<span className="sr-only"> {selected.period}</span></button>
    </aside></div>
    <details className="viz-table-details"><summary>{t('forecast.table')}</summary><div className="real-table-wrap" tabIndex={0} role="region" aria-label={t('forecast.table')}><table><caption>{s.metric} · {s.geography_name}</caption><thead><tr><th>{t('real.period')}</th><th>{t('forecast.observed')}</th><th>{t('forecast.change')}</th><th>{t('real.evidence')}</th></tr></thead><tbody>{s.observations.map(p=>{const c=history.changes.find(c=>c.to_id===p.observation_id);return <tr key={p.observation_id}><th scope="row">{p.period}{p.partial&&<small>{t('forecast.partial')}</small>}</th><td>{format(p.value)}</td><td>{c?.absolute_change!=null?`${nf.format(c.absolute_change)} ${s.unit==='percent'?t('forecast.pp'):s.unit==='persons'?t('forecast.persons'):t('forecast.vacancies')}`:t('forecast.UNAVAILABLE')}</td><td><button type="button" className="real-evidence-link" onClick={()=>onEvidence(p)}>{t('real.evidence')}<span className="sr-only"> {p.period}</span></button></td></tr>;})}</tbody></table></div></details>
    {forecast.status==='FORECAST'&&<div className="real-table-wrap"><table><caption>{t('forecast.modelOutput')} · {t('forecast.interval')}</caption><thead><tr><th>{t('real.period')}</th><th>{t('forecast.predicted')}</th><th>{t('forecast.interval')}</th></tr></thead><tbody>{forecast.forecasts.map(p=><tr key={p.period}><th>{p.period}</th><td>{format(p.value)}</td><td>{format(p.lower)}–{format(p.upper)}</td></tr>)}</tbody></table></div>}
  </VisualizationFrame>;
}
