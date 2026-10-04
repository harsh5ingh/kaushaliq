"""Write evidence artifacts to an explicitly named report directory, never canonical data.

Usage from backend: python -m src.trends.audit ../docs/phase-4/verification
"""
import json
import sys
from pathlib import Path
from src.trends.repository import read_trends, coverage


def main(output):
    folder=Path(output).resolve()
    canonical=Path(__file__).resolve().parents[3]/'data'
    if folder==canonical or canonical in folder.parents:
        raise ValueError('Audit output cannot target data storage')
    folder.mkdir(parents=True,exist_ok=True)
    bundle=read_trends(); inventory=[]; backtests=[]
    for series in bundle[0]:
        f=bundle[5][series.series_id];r=bundle[4][series.series_id]
        inventory.append({**series.model_dump(mode='json',exclude={'observations'}),
            'observation_count':len(series.observations),'periods':[p.period for p in series.observations],
            'period_start':series.observations[0].period_start.isoformat(),'period_end':series.observations[-1].period_end.isoformat(),
            'observation_ids':[p.observation_id for p in series.observations],
            'partial_periods':[p.period for p in series.observations if p.partial],
            'quality_statuses':sorted({p.quality_status for p in series.observations}),
            'source_versions':sorted({p.source_version for p in series.observations}),
            'raw_sha256':sorted({p.evidence.raw_sha256 for p in series.observations}),
            'trend_status':r.trend_status,'readiness':f.readiness.model_dump(mode='json')})
        if f.backtest.status=='AVAILABLE':
            backtests.append({'series_id':series.series_id,'metric':series.metric,'geography':series.geography_id,
                'classification':series.classification,'historical_window':[series.observations[0].period,series.observations[-1].period],
                'backtest':f.backtest.model_dump(mode='json'),'prospective_forecast_status':f.status,'reason_codes':f.readiness.reason_codes})
    for name,value in [('series-inventory.json',inventory),('backtest-results.json',backtests),('coverage.json',coverage(bundle))]:
        (folder/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Inventoried {len(inventory)} series; {len(backtests)} historical diagnostics; no canonical writes.')


if __name__=='__main__':main(sys.argv[1])
