"""Synthetic series below exist ONLY inside isolated tests, never publications."""
import unittest
from datetime import date
from unittest.mock import patch
from pydantic import ValidationError
from src.trends.models import HistoricalSeries, HistoricalPoint, ForecastResult
from src.trends.engine import changes, readiness, backtest, forecast, missing_periods
from src.trends.repository import read_trends, coverage, project, publications
from test_accounts import Client

def fixture(n=9, unit='percent'):
    evidence={'source_id':'TEST-ONLY','locator':'isolated unit fixture','raw_sha256':'a'*64,'transformations':['TEST ONLY']}
    points=[HistoricalPoint(observation_id=f'test-{i}',period=str(2010+i),period_start=date(2010+i,1,1),period_end=date(2010+i,12,31),
        value=30+i%3,original_value=str(30+i%3),original_unit=unit,unit=unit,source_id='TEST-ONLY',source_version='test-1',
        publication_version='test-publication',identity={'population':'TEST ONLY'},quality_status='VALID',evidence=evidence) for i in range(n)]
    return HistoricalSeries(series_id='test-series',family='labour',metric='TEST ONLY',unit=unit,geography_id='test-geography',
        geography_level='country',geography_name='TEST ONLY',classification={},frequency='ANNUAL',methodology_version='test-1',
        observations=points,source_ids=['TEST-ONLY'],missing_periods=[],limitations=['TEST ONLY'])

class TrendTests(unittest.TestCase):
    def test_typed_contract_preserves_observed_original_and_evidence(self):
        s=fixture();r=forecast(s)
        self.assertEqual(r.status,'FORECAST');self.assertTrue(all(x.status=='FORECAST' for x in r.forecasts))
        self.assertTrue(all(x.status=='OBSERVED' for x in r.series.observations));self.assertEqual(r.evidence[0],s.observations[0].evidence)
        self.assertEqual(r.historical_observation_ids,[p.observation_id for p in s.observations])
        invalid=r.model_dump();invalid['readiness']['status']='INSUFFICIENT_HISTORY'
        with self.assertRaises(ValidationError):ForecastResult.model_validate(invalid)
        invalid=r.model_dump();invalid['status']='UNAVAILABLE'
        with self.assertRaises(ValidationError):ForecastResult.model_validate(invalid)
        invalid=r.model_dump();invalid['backtest']['mae']=None
        with self.assertRaises(ValidationError):ForecastResult.model_validate(invalid)
    def test_change_percentage_points_growth_and_direction(self):
        s=fixture();c=changes(s)[0]
        self.assertEqual(c.absolute_change,1);self.assertEqual(c.change_unit,'percentage points');self.assertAlmostEqual(c.growth_percent,100/30)
        self.assertEqual(c.direction,'INCREASE');self.assertEqual(c.status,'DERIVED');self.assertEqual(len(c.evidence),2)
        self.assertEqual(changes(s)[2].direction,'DECREASE')
    def test_zero_base_growth_is_unavailable_but_delta_defined(self):
        s=fixture();s.observations[0].value=0;c=changes(s)[0]
        self.assertIsNone(c.growth_percent);self.assertEqual(c.absolute_change,31);self.assertIn('ZERO_BASE_GROWTH_UNAVAILABLE',c.reason_codes)
    def test_missing_periods_not_filled_or_connected(self):
        s=fixture();s.observations.pop(2);original=len(s.observations)
        self.assertEqual(missing_periods(s.observations,s.frequency),['2012-01-01/2012-12-31'])
        self.assertEqual(readiness(s,1).status,'MISSING_PERIODS');self.assertEqual(changes(s)[1].status,'UNAVAILABLE')
        self.assertEqual(forecast(s).forecasts,[]);self.assertEqual(len(s.observations),original)
    def test_incompatible_units_populations_versions_classifications(self):
        for field,value in [('unit','persons'),('identity',{'population':'different'}),('source_version','changed'),('publication_version','changed')]:
            s=fixture();setattr(s.observations[1],field,value)
            self.assertEqual(readiness(s,1).status,'INCOMPATIBLE_SERIES',field);self.assertEqual(changes(s)[0].status,'UNAVAILABLE')
            self.assertEqual(backtest(s).status,'UNAVAILABLE')
    def test_partial_and_quality_restrictions_propagate(self):
        for field,value in [('partial',True),('quality_status','QUARANTINED'),('quality_status','WARNING')]:
            s=fixture();setattr(s.observations[-1],field,value)
            self.assertEqual(readiness(s,1).status,'QUALITY_RESTRICTION');self.assertEqual(forecast(s).quality_status,'RESTRICTED')
            self.assertEqual(changes(s)[-1].status,'UNAVAILABLE');self.assertIsNone(forecast(s).generated_at)
    def test_insufficient_history_depends_on_horizon(self):
        self.assertEqual(readiness(fixture(6),1).status,'INSUFFICIENT_HISTORY')
        self.assertEqual(readiness(fixture(7),1).status,'READY');self.assertEqual(readiness(fixture(7),2).status,'INSUFFICIENT_HISTORY')
        self.assertEqual(readiness(fixture(9),3).status,'READY')
        with self.assertRaises(ValueError):readiness(fixture(),0)
    def test_unknown_geography_point_and_empty_are_unavailable(self):
        s=fixture();s.geography_id=None;self.assertEqual(readiness(s,1).status,'INSUFFICIENT_COVERAGE')
        s=fixture(1);s.frequency='POINT';self.assertEqual(forecast(s).status,'UNAVAILABLE')
        s=fixture(0);self.assertEqual(readiness(s,1).status,'UNAVAILABLE');self.assertEqual(forecast(s).forecasts,[])
    def test_methodology_boundary_does_not_block_historical_diagnostics(self):
        s=fixture(7);s.applicability_end=date(2016,12,31)
        self.assertEqual(backtest(s).status,'AVAILABLE');self.assertEqual(forecast(s).status,'UNAVAILABLE')
        self.assertIn('METHODOLOGY_BOUNDARY',forecast(s).readiness.reason_codes)
    def test_rolling_origin_no_future_leakage_and_exact_metrics(self):
        s=fixture(7);b=backtest(s)
        self.assertEqual(len(b.folds),3)
        self.assertEqual([f.predicted for f in b.folds],[30,31,32]);self.assertEqual([f.error for f in b.folds],[1,1,-2])
        self.assertAlmostEqual(b.mae,4/3);self.assertAlmostEqual(b.rmse,2**.5);self.assertEqual(b.bias,0)
        for f in b.folds:self.assertNotIn(f.target_id,f.training_ids)
        s.observations[-1].value=50;self.assertEqual(backtest(s).folds[0],b.folds[0])
    def test_forecast_baseline_horizon_and_uncertainty_no_clipping(self):
        r=forecast(fixture(),3)
        self.assertEqual(len(r.forecasts),3);self.assertTrue(all(p.value==32 for p in r.forecasts))
        self.assertEqual(r.forecasts[0].period_start,date(2019,1,1));self.assertGreater(r.forecasts[2].upper-r.forecasts[2].lower,r.forecasts[0].upper-r.forecasts[0].lower)
        s=fixture();s.observations[-1].value=99;self.assertEqual(forecast(s).status,'UNAVAILABLE')
        s=fixture();[setattr(p,'value',30) for p in s.observations];self.assertIn('UNCERTAINTY_UNSUPPORTED',forecast(s).readiness.reason_codes)
    def test_nonfinite_impossible_values_rejected(self):
        row=fixture().observations[0].model_dump()
        for value in [float('nan'),float('inf'),-1,101]:
            with self.assertRaises(ValidationError):HistoricalPoint.model_validate({**row,'value':value})
    def test_duplicate_identity_and_nonannual_period_rejected(self):
        s=fixture();s.observations[1].observation_id=s.observations[0].observation_id
        self.assertEqual(readiness(s,1).status,'INCOMPATIBLE_SERIES');self.assertEqual(backtest(s).status,'UNAVAILABLE')
        s=fixture();s.observations[0].period_start=date(2010,6,1)
        self.assertEqual(changes(s)[0].status,'UNAVAILABLE');self.assertIn('ANNUAL_FREQUENCY_REQUIRED',readiness(s,1).reason_codes)
    def test_adapter_never_relabels_estimates_as_observations(self):
        import copy
        base,demand,supply,versions=publications();demand=copy.deepcopy(demand);demand['signals'][0]['status']='ESTIMATED'
        with self.assertRaises(ValueError):project(base,demand,supply,versions)
    def test_real_inventory_no_forecast_or_quarantine_fallback(self):
        bundle=read_trends();c=coverage(bundle)
        self.assertEqual(c['series_count'],1162);self.assertEqual(c['historical_series_count'],125);self.assertEqual(c['forecast_ready_count'],0)
        self.assertEqual(sum(len(s.observations) for s in bundle[0]),1701)
        self.assertTrue(all(r.status=='UNAVAILABLE' and not r.forecasts for r in bundle[5].values()))
        self.assertFalse(any(s.family=='supply' and s.metric=='TRAINED' and s.geography_id=='in' and any(p.period=='2024-25' for p in s.observations) for s in bundle[0]))
        self.assertEqual(sum(r.backtest.status=='AVAILABLE' for r in bundle[5].values()),54)
    def test_real_api_filter_traceability_empty_bounded_and_public(self):
        c=Client();q='family=labour&metric=LFPR&geography_id=in&sex=persons&sector=combined&activity_status=US'
        code,v=c.request('GET','/api/v1/intelligence/trends?'+q);self.assertEqual(code,200);self.assertEqual(v['total'],1)
        s=v['items'][0]['series'];self.assertEqual([p['value'] for p in s['observations']],[49.8,50.2,53.5,54.9,55.2,57.9,60.1])
        self.assertEqual(c.request('GET','/api/v1/intelligence/forecast?'+q)[1]['status'],'UNAVAILABLE')
        e=c.request('GET','/api/v1/intelligence/forecast/evidence?series_id='+s['series_id'])[1]
        self.assertEqual(e['items'][0]['evidence'][0],s['observations'][0]['evidence']);self.assertNotIn('raw_path',str(e))
        self.assertEqual(c.request('GET','/api/v1/intelligence/trends?geography_id=not-connected')[1]['status'],'EMPTY')
        for query in ['limit=101','horizon=0','horizon=4','family=invalid']:
            self.assertEqual(c.request('GET','/api/v1/intelligence/forecast?'+query)[0],422)
        self.assertEqual(c.request('GET','/api/v1/intelligence/forecast/quality')[0],200)
    def test_api_integrity_failure_never_falls_back(self):
        with patch('src.routes.trends.read_trends',side_effect=ValueError('internal path')):
            code,v=Client().request('GET','/api/v1/intelligence/forecast');self.assertEqual(code,503)
            self.assertNotIn('internal path',str(v));self.assertEqual(v['detail']['code'],'TREND_PUBLICATION_UNAVAILABLE')
