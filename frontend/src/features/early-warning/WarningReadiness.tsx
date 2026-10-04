import {useLocale} from '../../hooks/usePreferences';
import {reasonLabel,requiredLabel,stateLabel} from '../phase5/labels';
import type {MessageKey} from '../../app/i18n/config';
import type {SignalReadiness} from './contracts';
export function WarningReadiness({items}:{items:SignalReadiness[]}){
  const {t,locale}=useLocale(),nf=new Intl.NumberFormat(locale);
  return <section className="warning-readiness" id="warning-readiness" aria-labelledby="warning-readiness-heading">
    <header><h2 id="warning-readiness-heading">{t('warning.readiness')}</h2><p>{t('warning.coverageNote')}</p></header>
    <div className="phase5-readiness-list">{items.map(r=><details key={r.signal_type}>
      <summary><span>{t(`warning.${r.signal_type}`)}</span><span className={`phase5-state ${r.status==='READY'?'is-ready':''}`}>{stateLabel(t,r.status)}</span></summary>
      <ul>{r.reason_codes.map(code=><li key={code}>{reasonLabel(t,code)}</li>)}</ul>
      <p>{t('warning.eligible')}: {nf.format(r.eligible_series)} · {t('warning.minimum')}: {nf.format(r.minimum_history)}</p>
      {!!r.required_data.length&&<><h3>{t('warning.required')}</h3><p>{requiredLabel(t,r.signal_type)}</p></>}
      {!!r.checks.length&&<dl className="phase5-checks">{r.checks.map((c,i)=><div key={`${c.code}-${i}`}><dt>{reasonLabel(t,c.code)}</dt><dd>{t((c.passed?'phase5.READY':'phase5.NOT_READY') as MessageKey)}</dd></div>)}</dl>}
      <details className="phase5-method"><summary>{t('phase5.technical')}</summary><p lang="en">{r.reason}</p><ul lang="en">{r.required_data.map((v,i)=><li key={i}>{v}</li>)}</ul><ul lang="en">{r.checks.map((c,i)=><li key={i}>{c.explanation}</li>)}</ul></details>
    </details>)}</div>
  </section>;
}
