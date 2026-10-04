import { useLocale } from '../../hooks/usePreferences';
import type { Point } from './contracts';
/** Indexes only genuine API observations; never manufactures timeline years. */
export function ObservationTimeline({points,selected,onSelect}:{points:Point[];selected:Point;onSelect:(id:string)=>void}){
  const {t}=useLocale(),index=points.findIndex(p=>p.observation_id===selected.observation_id);
  return <div className="forecast-timeline"><label>{t('forecast.timeline')}<input type="range" min={0} max={Math.max(0,points.length-1)} step={1} value={index} disabled={points.length<2}
    aria-label={t('forecast.timeline')} aria-valuetext={selected.period} onChange={e=>onSelect(points[Number(e.target.value)].observation_id)} /></label>
    <div><span>{points[0].period}</span><strong>{selected.period}</strong><span>{points[points.length-1].period}</span></div>
  </div>;
}
