"""TEST ONLY inputs exercise rule gates; no fixtures enter published repositories."""
import copy
from datetime import date
from pathlib import Path
from unittest.mock import patch
import unittest
from pydantic import ValidationError
from src.early_warning.engine import inspect, unsupported, coverage_notice, POLICY, UNSUPPORTED
from src.early_warning.models import RulePolicy, Warning, EarlyWarningResponse
from src.early_warning.repository import read_early_warning, coverage, quality, coverage_notices
from src.trends.models import HistoricalSeries, HistoricalPoint
from src.trends.repository import read_trends
from test_accounts import Client


def fixture(values=(40,42), training=False):
    family='supply' if training else 'labour'
    metric='TRAINED' if training else 'LFPR'
    unit='persons' if training else 'percent'
    frequency='FISCAL_YEAR' if training else 'ANNUAL'
    identity={'family':family,'metric':metric,'geography_id':'TEST-GEO','frequency':frequency,
        'unit':unit,'methodology_version':'TEST-ONLY-v1','population':'TEST ONLY'}
    evidence={'source_id':'TEST-ONLY','locator':'isolated test source cell','raw_sha256':'a'*64,'transformations':['TEST ONLY']}
    points=[]
    for i,value in enumerate(values):
        year=2020+i
        points.append(HistoricalPoint(observation_id=f'TEST-{i}',period=f'{year}-{year+1}' if training else str(year),
            period_start=date(year,4,1) if training else date(year,1,1),
            period_end=date(year+1,3,31) if training else date(year,12,31),
            value=value,original_value=str(value),original_unit=unit,unit=unit,source_id='TEST-ONLY',
            source_version='TEST-ONLY-v1',publication_version='TEST-ONLY-publication',identity=identity,
            quality_status='VALID',evidence=evidence))
    s=HistoricalSeries(series_id='TEST-ONLY-series',family=family,metric=metric,unit=unit,geography_id='TEST-GEO',
        geography_level='country',geography_name='TEST ONLY',classification={'population':'TEST ONLY'},
        frequency=frequency,methodology_version='TEST-ONLY-v1',observations=points,source_ids=['TEST-ONLY'],
        missing_periods=[],limitations=['TEST ONLY: isolated fixture, not labour-market data'])
    sources={'TEST-ONLY':{'source_id':'TEST-ONLY','connected':True,'version':'TEST-ONLY-v1','sha256':'a'*64}}
    return s,sources


def review(s,sources,kind='LABOUR_INDICATOR_CHANGE',policy=POLICY):
    return inspect(s,kind,sources,policy)


class EarlyWarningTests(unittest.TestCase):
    def test_valid_warning_generation_and_exact_native_change(self):
        s,src=fixture();r,w=review(s,src)
        self.assertEqual(r.status,'READY');self.assertEqual(w.derived_metrics.absolute_change,2)
        self.assertEqual(w.derived_metrics.change_unit,'percentage points')
        self.assertEqual(w.signal_type,'LABOUR_INDICATOR_CHANGE');self.assertEqual(w.severity,'REVIEW')
        self.assertEqual(w.status,'DERIVED');self.assertTrue(all(p.status=='OBSERVED' for p in w.observed_values))
        self.assertIn('not a calibrated severity',w.confidence_or_qualification)

    def test_threshold_boundary_below_and_configurable_policy(self):
        for values,trigger in [((40,41.99),False),((40,42),True),((40,38),True),((40,37.99),True)]:
            s,src=fixture(values);self.assertEqual(review(s,src)[1] is not None,trigger)
        s,src=fixture();self.assertIsNone(review(s,src,policy=RulePolicy(labour_change_pp=3))[1])
        with self.assertRaises(ValidationError):RulePolicy(labour_change_pp=0)

    def test_insufficient_history(self):
        s,src=fixture((40,));r,w=review(s,src)
        self.assertEqual(r.status,'INSUFFICIENT_HISTORY');self.assertIsNone(w)
        self.assertIn('INSUFFICIENT_HISTORY',r.reason_codes);self.assertTrue(r.required_data)

    def test_missing_observation_not_zero_or_interpolated(self):
        s,src=fixture(());before=s.model_dump();r,w=review(s,src)
        self.assertEqual(r.status,'UNAVAILABLE');self.assertIsNone(w)
        self.assertEqual(s.model_dump(),before);self.assertEqual(r.evidence,[])

    def test_incompatible_periods(self):
        s,src=fixture();s.observations[-1].period_start=date(2022,1,1);s.observations[-1].period_end=date(2022,12,31)
        r,w=review(s,src);self.assertIn('MISSING_PERIODS',r.reason_codes);self.assertIsNone(w)
        s,src=fixture();s.observations[-1].period_end=date(2021,11,30)
        self.assertIn('INCOMPATIBLE_PERIOD_LENGTH',review(s,src)[0].reason_codes)

    def test_incompatible_units(self):
        s,src=fixture();s.observations[-1].unit='persons'
        r,w=review(s,src);self.assertEqual(r.status,'INCOMPATIBLE_SERIES');self.assertIsNone(w)
        self.assertIn('INCOMPATIBLE_UNITS',r.reason_codes)

    def test_quality_blocked_observations(self):
        for q in ['WARNING','QUARANTINED']:
            s,src=fixture();s.observations[-1].quality_status=q
            r,w=review(s,src);self.assertEqual(r.status,'QUALITY_RESTRICTION');self.assertIsNone(w)

    def test_partial_labour_period_cannot_trigger(self):
        s,src=fixture();s.observations[-1].partial=True
        r,w=review(s,src);self.assertIn('QUALITY_RESTRICTION',r.reason_codes);self.assertIsNone(w)

    def test_unavailable_signal_dimensions(self):
        for kind in UNSUPPORTED:
            s,src=fixture();r,w=review(s,src,kind)
            self.assertEqual(r.status,'NOT_READY');self.assertIsNone(w);self.assertTrue(r.required_data)
        self.assertIn('not measure available workforce',unsupported('SUPPLY_ACCELERATION').reason)

    def test_provenance_propagation(self):
        s,src=fixture();w=review(s,src)[1]
        self.assertEqual(w.provenance[0].publication_version,'TEST-ONLY-publication')
        self.assertEqual(w.provenance[0].observation_ids,['TEST-0','TEST-1'])
        self.assertEqual(w.observed_values[0].original_value,'40')

    def test_evidence_propagation_and_typed_rejection(self):
        s,src=fixture();w=review(s,src)[1];self.assertEqual(w.evidence,[p.evidence for p in s.observations])
        invalid=w.model_dump();invalid['evidence'][0]['raw_sha256']='b'*64
        with self.assertRaises(ValidationError):Warning.model_validate(invalid)
        invalid=w.model_dump();invalid['provenance'][0]['observation_ids']=['fabricated']
        with self.assertRaises(ValidationError):Warning.model_validate(invalid)

    def test_deterministic_rules_and_no_mutation(self):
        s,src=fixture();before=copy.deepcopy(s.model_dump());a=review(s,src);b=review(s,src)
        self.assertEqual(a,b);self.assertEqual(s.model_dump(),before)
        s2,src2=fixture();self.assertEqual(a[1].signal_id,review(s2,src2)[1].signal_id)

    def test_source_checksum_version_and_connection_gates(self):
        for field,value in [('sha256','b'*64),('version','TEST-OTHER'),('connected',False)]:
            s,src=fixture();src['TEST-ONLY'][field]=value
            r,w=review(s,src);self.assertIn('SOURCE_EVIDENCE_REQUIRED',r.reason_codes);self.assertIsNone(w)
        s,src=fixture();self.assertIsNone(review(s,{})[1])

    def test_identity_geography_and_duplicate_gates(self):
        s,src=fixture();s.observations[1].identity={**s.observations[1].identity,'population':'OTHER'}
        self.assertIsNone(review(s,src)[1])
        s,src=fixture();s.observations[1].observation_id=s.observations[0].observation_id
        self.assertIn('INCOMPATIBLE_SERIES',review(s,src)[0].reason_codes)
        s,src=fixture();s.geography_id=None
        for p in s.observations:p.identity={**p.identity,'geography_id':None}
        self.assertEqual(review(s,src)[0].status,'INSUFFICIENT_COVERAGE')

    def test_series_metadata_cannot_reassign_source_identity(self):
        for field,value in [('geography_id','OTHER'),('unit','persons'),('classification',{'population':'OTHER'})]:
            s,src=fixture();setattr(s,field,value)
            self.assertIn('INCOMPATIBLE_SERIES',review(s,src)[0].reason_codes)
            self.assertIsNone(review(s,src)[1])
        s,src=fixture();w=review(s,src)[1];invalid=w.model_dump()
        invalid['geography']['geography_id']='OTHER'
        with self.assertRaises(ValidationError):Warning.model_validate(invalid)

    def test_unrelated_missing_period_does_not_inherit_quarantine_claim(self):
        s,src=fixture((100,110,132),training=True)
        s.observations.pop(1);s.missing_periods=['2021-04-01/2022-03-31'];s.geography_id='in'
        for p in s.observations:p.identity={**p.identity,'geography_id':'in'}
        q={'supply':{'quarantined':[{'indicator':'trained','region_id':'in','period':'2024-25','difference':120}]}}
        notices=coverage_notices([s],q)
        warning=next(w for w in notices if w.trigger_rule.rule_id=='COVERAGE_MISSING_PERIOD')
        self.assertNotIn('120',warning.trigger_rule.methodology)
        self.assertFalse(any(w.trigger_rule.rule_id=='COVERAGE_QUARANTINED_PERIOD' for w in notices))

    def test_historical_methodology_boundary_without_forecast_requirement(self):
        s,src=fixture();s.applicability_end=date(2021,12,31)
        self.assertIsNotNone(review(s,src)[1])
        s.applicability_end=date(2020,12,31)
        self.assertIn('METHODOLOGY_BOUNDARY',review(s,src)[0].reason_codes)
        self.assertIsNone(review(s,src)[1])

    def test_training_growth_acceleration_boundary_and_units(self):
        s,src=fixture((100,110,132),training=True);r,w=review(s,src,'TRAINING_OUTPUT_ACCELERATION')
        self.assertEqual(r.status,'READY');self.assertEqual(w.derived_metrics.previous_growth_percent,10)
        self.assertEqual(w.derived_metrics.growth_percent,20);self.assertEqual(w.derived_metrics.acceleration_pp,10)
        self.assertEqual(w.entity_type,'training_output');self.assertEqual(w.derived_metrics.change_unit,'persons')
        s,src=fixture((100,110,131),training=True)
        self.assertIsNone(review(s,src,'TRAINING_OUTPUT_ACCELERATION')[1])
        s,src=fixture((100,90,99),training=True)
        self.assertIsNotNone(review(s,src,'TRAINING_OUTPUT_ACCELERATION')[1])

    def test_training_latest_growth_must_be_positive(self):
        s,src=fixture((100,50,40),training=True)
        self.assertIsNone(review(s,src,'TRAINING_OUTPUT_ACCELERATION')[1])

    def test_training_partial_exclusion_explicit_and_missing_not_filled(self):
        s,src=fixture((100,110,132,9999),training=True);s.observations[-1].partial=True
        r,w=review(s,src,'TRAINING_OUTPUT_ACCELERATION')
        self.assertIsNotNone(w);self.assertEqual(w.observed_values[-1].value,132)
        self.assertIn('partial fiscal-year',str(w.limitations));self.assertEqual(len(s.observations),4)
        s.observations.pop(1);self.assertIsNone(review(s,src,'TRAINING_OUTPUT_ACCELERATION')[1])

    def test_zero_training_baseline_cannot_create_growth(self):
        s,src=fixture((0,110,132),training=True);r,w=review(s,src,'TRAINING_OUTPUT_ACCELERATION')
        self.assertIn('ZERO_BASE_GROWTH_UNAVAILABLE',r.reason_codes);self.assertIsNone(w)

    def test_wrong_semantics_cannot_be_relabelled(self):
        s,src=fixture();s.family='demand';s.metric='active_vacancies'
        self.assertIsNone(review(s,src)[1]);self.assertIn('UNSUPPORTED_METRIC',review(s,src)[0].reason_codes)

    def test_coverage_notice_has_no_labour_arithmetic(self):
        s,src=fixture((40,));w=coverage_notice(s,'COVERAGE_SINGLE_SNAPSHOT','Only one observation is connected.')
        self.assertEqual(w.severity,'INFO');self.assertIsNone(w.derived_metrics.absolute_change)
        self.assertIsNone(w.derived_metrics.growth_percent);self.assertEqual(w.evidence,[s.observations[0].evidence])
        invalid=w.model_dump();invalid['derived_metrics']['growth_percent']=33
        with self.assertRaises(ValidationError):Warning.model_validate(invalid)

    def test_impossible_derived_warning_contract_rejected(self):
        s,src=fixture();w=review(s,src)[1]
        for field,value in [('signal_type','DEMAND_ACCELERATION'),('severity','INFO'),('comparison_period','invented')]:
            invalid=w.model_dump();invalid[field]=value
            with self.assertRaises(ValidationError):Warning.model_validate(invalid)
        invalid=w.model_dump();invalid['derived_metrics']['absolute_change']=99
        with self.assertRaises(ValidationError):Warning.model_validate(invalid)
        invalid=w.model_dump();invalid['observed_values'][0]['partial']=True
        with self.assertRaises(ValidationError):Warning.model_validate(invalid)

    def test_known_observation_cutoff_cannot_claim_complete_future_period(self):
        s,src=fixture();s.observations[-1].as_of=date(2021,11,30)
        self.assertEqual(review(s,src)[0].status,'QUALITY_RESTRICTION')
        self.assertIsNone(review(s,src)[1])
        s,src=fixture();w=review(s,src)[1];invalid=w.model_dump()
        invalid['observed_values'][-1]['as_of']='2021-11-30'
        with self.assertRaises(ValidationError):Warning.model_validate(invalid)

    def test_quality_api_bounded_pagination_and_filters(self):
        c=Client();code,v=c.request('GET','/api/v1/intelligence/early-warning/quality?limit=1')
        self.assertEqual(code,200);self.assertGreater(v['total'],1);self.assertEqual(len(v['items']),1)
        _,page=c.request('GET','/api/v1/intelligence/early-warning/quality?offset=10000')
        self.assertEqual(page['total'],v['total']);self.assertEqual(page['items'],[])
        self.assertEqual(c.request('GET','/api/v1/intelligence/early-warning/quality?limit=101')[0],422)
        self.assertEqual(c.request('GET','/api/v1/intelligence/early-warning/quality?geography_id=absent')[1]['total'],0)

    def test_classification_cannot_override_native_metadata_fields(self):
        s,src=fixture();s.geography_id='OTHER';s.classification={**s.classification,'geography_id':'TEST-GEO'}
        self.assertIn('INCOMPATIBLE_SERIES',review(s,src)[0].reason_codes);self.assertIsNone(review(s,src)[1])

    def test_real_publications_no_fabricated_observations_or_active_unsupported_types(self):
        b=read_early_warning();h=read_trends();by_id={p.observation_id:p for s in h[0] for p in s.observations}
        self.assertTrue(b['warnings'])
        self.assertEqual({w.signal_type for w in b['warnings']},{'LABOUR_INDICATOR_CHANGE','DATA_COVERAGE_WARNING'})
        self.assertEqual(len([w for w in b['warnings'] if w.signal_type=='LABOUR_INDICATOR_CHANGE']),18)
        self.assertEqual(len([w for w in b['warnings'] if w.signal_type=='DATA_COVERAGE_WARNING']),8)
        for w in b['warnings']:
            for p in w.observed_values:self.assertEqual(p,by_id[p.observation_id])
        self.assertFalse(any(p.period=='2024-25' and p.identity.get('metric')=='TRAINED' and p.identity.get('geography_id')=='in' for w in b['warnings'] for p in w.observed_values))
        self.assertEqual(sum(len(s.observations) for s in h[0]),1701)

    def test_real_coverage_quality_readiness_and_exclusions(self):
        b=read_early_warning();c=coverage(b);q=quality(b)
        states={r.signal_type:r for r in c['items']}
        self.assertEqual(states['LABOUR_INDICATOR_CHANGE'].eligible_series,54)
        self.assertEqual(states['TRAINING_OUTPUT_ACCELERATION'].eligible_series,71)
        self.assertTrue(all(states[k].status=='NOT_READY' for k in UNSUPPORTED))
        self.assertEqual(q['excluded_partial_observations'],72);self.assertFalse(q['quarantined_records_used'])
        self.assertEqual(q['source_quality']['supply']['quarantined'][0]['difference'],120)

    def test_api_public_filter_pagination_and_evidence(self):
        c=Client();code,v=c.request('GET','/api/v1/intelligence/early-warning?limit=1')
        self.assertEqual(code,200);self.assertEqual(v['total'],26);self.assertEqual(len(v['items']),1)
        code,e=c.request('GET','/api/v1/intelligence/early-warning/evidence?signal_id='+v['items'][0]['signal_id'])
        self.assertEqual(code,200);self.assertEqual(e['item'],v['items'][0]);self.assertNotIn('raw_path',str(e))
        _,v=c.request('GET','/api/v1/intelligence/early-warning?offset=1000')
        self.assertEqual(v['status'],'AVAILABLE');self.assertEqual(v['total'],26);self.assertEqual(v['items'],[])
        _,v=c.request('GET','/api/v1/intelligence/early-warning?signal_type=EMERGING_SKILL_SIGNAL')
        self.assertEqual(v['status'],'UNAVAILABLE');self.assertEqual(v['items'],[]);self.assertTrue(v['readiness'][0]['required_data'])
        _,v=c.request('GET','/api/v1/intelligence/early-warning?geography_id=not-connected')
        self.assertEqual(v['status'],'EMPTY');self.assertEqual(v['total'],0)
        self.assertEqual(c.request('GET','/api/v1/intelligence/early-warning?severity=INFO')[1]['total'],8)
        self.assertEqual(c.request('GET','/api/v1/intelligence/early-warning/coverage')[0],200)
        self.assertEqual(c.request('GET','/api/v1/intelligence/early-warning/quality')[0],200)

    def test_api_validation_and_not_found(self):
        c=Client()
        for query in ['limit=101','limit=0','offset=-1','signal_type=UNKNOWN','severity=CRITICAL','geography_id='+'x'*121]:
            self.assertEqual(c.request('GET','/api/v1/intelligence/early-warning?'+query)[0],422,query)
        self.assertEqual(c.request('GET','/api/v1/intelligence/early-warning/evidence?signal_id=missing')[0],404)
        self.assertEqual(c.request('GET','/api/v1/intelligence/early-warning/evidence')[0],422)

    def test_eligible_training_below_threshold_is_empty_not_unavailable(self):
        code,v=Client().request('GET','/api/v1/intelligence/early-warning?signal_type=TRAINING_OUTPUT_ACCELERATION')
        self.assertEqual(code,200);self.assertEqual(v['status'],'EMPTY');self.assertEqual(v['total'],0)
        self.assertEqual(v['readiness'][0]['status'],'READY');self.assertEqual(v['readiness'][0]['eligible_series'],71)

    def test_api_failure_sanitized_no_fallback(self):
        with patch('src.routes.early_warning.read_early_warning',side_effect=ValueError('private secret internal path')):
            for suffix in ['', '/coverage','/quality','/evidence?signal_id=x']:
                code,v=Client().request('GET','/api/v1/intelligence/early-warning'+suffix)
                self.assertEqual(code,503);self.assertNotIn('private secret',str(v))
                self.assertEqual(v['detail']['code'],'EARLY_WARNING_PUBLICATION_UNAVAILABLE')

    def test_unavailable_response_cannot_smuggle_warning(self):
        s,src=fixture();w=review(s,src)[1]
        with self.assertRaises(ValidationError):
            EarlyWarningResponse(version='TEST',engine_version='TEST',status='UNAVAILABLE',total=1,items=[w],readiness=[],sources=[])


if __name__=='__main__':
    unittest.main()
