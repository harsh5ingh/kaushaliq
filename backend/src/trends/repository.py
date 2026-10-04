"""Version-keyed read-only projections of the three existing publications."""
from collections import defaultdict, Counter
from functools import lru_cache
from hashlib import sha256
import json
from src.data_pipeline.repository import read_snapshot
from src.demand.repository import read_demand, public_source
from src.supply.repository import read_supply
from src.trends.models import HistoricalSeries, HistoricalPoint
from src.trends.engine import missing_periods, trend, forecast


def publications():
    base,bv=read_snapshot(); demand,dv,_=read_demand(); supply,sv,_=read_supply()
    return base,demand,supply,{'base':bv,'demand':dv,'supply':sv}


def project(base, demand, supply, versions):
    groups=defaultdict(list); meta={}; sources={s['source_id']:s for s in base['sources']}
    sources.update({s['source_id']:s for s in demand['sources']+supply['sources']})
    regions={r['region_id']:r for r in base['regions']}
    for family,rows in [('labour',base['labour']),('demand',demand['signals']),('supply',supply['signals'])]:
        for r in rows:
            if r['status']!='OBSERVED':
                raise ValueError('Only observed records may enter the historical series adapter')
            geo=r.get('region_id',r.get('geography_id')); metric=r.get('indicator',r.get('metric'))
            frequency='ANNUAL' if family=='labour' else r['period_type']
            if frequency not in {'ANNUAL','FISCAL_YEAR','POINT'}: continue
            classification={k:r.get(k) for k in ['sex','sector','activity_status','age_group','denominator','programme','population','occupation_code','occupation_system','skill_code','skill_system','sector_code','sector_system'] if k in r}
            # Each unmatched source geography remains distinct, never one artificial unknown region.
            identity={'family':family,'metric':metric,'geography_id':geo,'source_geography_label':r.get('source_geography_label') if geo is None else None,
                'frequency':frequency,'unit':r['unit'],'methodology_version':r['methodology_version'],**classification}
            key=json.dumps(identity,sort_keys=True); sid=sha256(key.encode()).hexdigest()[:32]
            evidence=r['evidence']; source=sources[evidence['source_id']]
            groups[sid].append(HistoricalPoint(observation_id=r.get('observation_id',r.get('signal_id',r.get('supply_signal_id'))),
                period=r.get('period',r.get('reference_period')),period_start=r['period_start'],period_end=r['period_end'],
                value=r['value'],original_value=r.get('original_value',str(r['value'])),original_unit=r.get('original_unit',r['unit']),unit=r['unit'],
                source_id=evidence['source_id'],source_version=source.get('version') or 'unspecified',publication_version=versions['base' if family=='labour' else family],
                identity=identity,quality_status=r.get('quality_status','VALID'),partial=r.get('partial',False),as_of=r.get('as_of'),evidence=evidence))
            meta[sid]=(family,metric,geo,classification,frequency,r['methodology_version'],regions.get(geo,{}).get('region_type',r.get('geography_level','unknown')),
                regions.get(geo,{}).get('name',r.get('source_geography_label','Unmapped')))
    series=[]
    for sid,points in groups.items():
        family,metric,geo,classification,freq,method,level,name=meta[sid];points.sort(key=lambda p:p.period_start)
        limits=['No missing observations are filled. No taxonomy relationships or district allocations are inferred.']
        if family=='labour': limits+=['Published population rates, not job demand. US and CWS and population strata are distinct.','Pre-January-2025 design; no reviewed bridge to revised PLFS.']
        elif family=='demand':limits+=['Historical NCS administrative vacancy stock; not live vacancies or total Indian labour demand.']
        else:limits+=['Reported training activity or centre stock; not current worker availability, seats or compatible vacancy supply.','Partial FY2026-27 is retained explicitly; national TRAINED FY2024-25 quarantine remains absent.']
        series.append(HistoricalSeries(series_id=sid,family=family,metric=metric,unit=points[0].unit,geography_id=geo,geography_level=level,
            geography_name=name,classification=classification,frequency=freq,methodology_version=method,
            applicability_end='2024-12-31' if family=='labour' else None,
            applicability_evidence_url='https://mospi.gov.in/sites/default/files/publication_reports/PLFS_Changes-in-2025_rev.pdf' if family=='labour' else None,
            observations=points,source_ids=sorted({p.source_id for p in points}),missing_periods=missing_periods(points,freq),limitations=limits))
    return sorted(series,key=lambda s:(s.family,s.metric,s.geography_name,s.series_id)),[public_source(s) for s in sources.values() if s.get('connected')]


@lru_cache(maxsize=4)
def _bundle(bv,dv,sv):
    base,demand,supply,versions=publications()
    if versions!={'base':bv,'demand':dv,'supply':sv}:raise ValueError('Publication changed while reading')
    series,sources=project(base,demand,supply,versions)
    version=sha256(json.dumps(versions,sort_keys=True).encode()).hexdigest()
    results={s.series_id:trend(s) for s in series}
    forecasts={s.series_id:forecast(s) for s in series}
    indexes={key:defaultdict(set) for key in ['family','metric','geography_id','sex','sector','activity_status']}
    for s in series:
        for key in indexes:
            value=getattr(s,key,None) if key in {'family','metric','geography_id'} else s.classification.get(key)
            indexes[key][value].add(s.series_id)
    return series,sources,version,versions,results,forecasts,indexes


def read_trends():
    *_,versions=publications()
    return _bundle(versions['base'],versions['demand'],versions['supply'])


def select(bundle, family=None, metric=None, geography_id=None, sex=None, sector=None, activity_status=None, series_id=None):
    ids={series_id} if series_id else set(bundle[4])
    for key,value in [('family',family),('metric',metric),('geography_id',geography_id),('sex',sex),('sector',sector),('activity_status',activity_status)]:
        if value:ids.intersection_update(bundle[6][key].get(value,set()))
    return [bundle[4][sid].series for sid in bundle[4] if sid in ids]


def coverage(bundle):
    series,sources,version,versions,results,forecasts=bundle[:6]
    return {'version':version,'publication_versions':versions,'series_count':len(series),
        'observations':sum(len(s.observations) for s in series),'historical_series_count':sum(r.trend_status=='DERIVED' for r in results.values()),
        'forecast_ready_count':sum(r.status=='FORECAST' for r in forecasts.values()),
        'readiness_counts':dict(Counter(r.readiness.status for r in forecasts.values())),
        'families':[{'family':f,'metrics':sorted({s.metric for s in series if s.family==f}),
            'geographies':[{'id':g,'name':next(s.geography_name for s in series if s.geography_id==g),'metrics':sorted({s.metric for s in series if s.family==f and s.geography_id==g})}
                for g in sorted({s.geography_id for s in series if s.family==f and s.geography_id is not None})],
            'observations':sum(len(s.observations) for s in series if s.family==f)} for f in ['labour','demand','supply']],
        'unsupported_dimensions':['district','occupation','skill','industry'],
        'quality':{'status':'VALIDATED_WITH_RESTRICTIONS','no_interpolation':True,
            'quarantined':read_supply()[0]['quality']['quarantined']},
        'sources':sources}
