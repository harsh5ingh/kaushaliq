"""Synthetic values are isolated TEST ONLY fixtures, never canonical observations."""
import json
import unittest
from unittest.mock import patch
from pydantic import ValidationError
from test_trends import fixture as trend_fixture
from test_accounts import Client
from src.scenarios.models import ScenarioRequest, ScenarioResult, Relationship
from src.scenarios.engine import execute, baseline_for
from src.scenarios.repository import coverage, evaluate, quality
from src.trends.repository import read_trends


def fixture(n=9,unit='percent'):
    series=trend_fixture(n,unit)
    for p in series.observations:
        p.identity={'family':series.family,'metric':series.metric,'geography_id':series.geography_id,
            'frequency':series.frequency,'unit':series.unit,'methodology_version':series.methodology_version,**series.classification}
    return series


def fixture_sources():
    return [{'source_id':'TEST-ONLY','publisher':'isolated fixture','connected':True,'sha256':'a'*64,'version':'test-1'}]


def request(change=30,kind='DIRECT_METRIC_SENSITIVITY',series_id='test-series'):
    return ScenarioRequest(scenario_type=kind,series_id=series_id,assumption={'kind':'DIRECT_METRIC_CHANGE' if kind=='DIRECT_METRIC_SENSITIVITY' else 'AI_ADOPTION','change_percent':change})


class ScenarioTests(unittest.TestCase):
    def test_direct_sensitivity_arithmetic_and_explicit_simulation(self):
        s=fixture(3);r=execute(request(),s,'test-version',fixture_sources())
        self.assertEqual(r.status,'SCENARIO');self.assertTrue(r.is_simulation);self.assertTrue(r.results[0].simulation)
        self.assertEqual(r.results[0].value,41.6);self.assertEqual(r.results[0].absolute_change,9.6)
        self.assertEqual(r.results[0].period,s.observations[-1].period)
        self.assertEqual(r.disclosure,'SIMULATION — NOT OBSERVED DATA')

    def test_shock_assumption_retained_without_fake_effects(self):
        r=execute(request(kind='SKILL_SHOCK'),fixture(),'test-version',fixture_sources())
        self.assertEqual(r.status,'NOT_READY');self.assertEqual(r.assumptions[0].change_percent,30)
        self.assertIn('MISSING_REVIEWED_IMPACT_RULE',r.reason_codes)
        self.assertEqual(r.results,[]);self.assertEqual(r.relationships,[]);self.assertEqual(r.affected_entities,[])

    def test_baseline_and_original_values_immutable(self):
        s=fixture();before=s.model_dump_json();r=execute(request(-20),s,'test-version',fixture_sources())
        self.assertEqual(before,s.model_dump_json());self.assertEqual(r.baseline.original_value,s.observations[-1].original_value)
        self.assertEqual(r.baseline.value,s.observations[-1].value)

    def test_report_cutoff_cannot_authorize_incomplete_baseline(self):
        s=fixture(1);s.observations[0].as_of=s.observations[0].period_start
        r=execute(request(),s,'test-version',fixture_sources())
        self.assertEqual(r.status,'UNAVAILABLE');self.assertEqual(r.results,[])

    def test_provenance_and_source_metadata_preserved(self):
        s=fixture();sources=fixture_sources()
        r=execute(request(),s,'test-version',sources)
        self.assertEqual(r.evidence,[s.observations[-1].evidence]);self.assertEqual(r.sources,sources)
        self.assertEqual(r.results[0].baseline_observation_id,r.baseline.observation_id)
        self.assertEqual(r.uncertainty.status,'UNAVAILABLE')

    def test_deterministic_result_identity_no_timestamp_guess(self):
        s=fixture();a=execute(request(),s,'test-version',fixture_sources());b=execute(request(),s,'test-version',fixture_sources())
        self.assertEqual(a.model_dump_json(),b.model_dump_json())
        self.assertNotEqual(a.scenario_id,execute(request(31),s,'test-version',fixture_sources()).scenario_id)
        self.assertNotEqual(a.scenario_id,execute(request(),s,'new-publication',fixture_sources()).scenario_id)

    def test_missing_and_unmapped_baseline_never_zero(self):
        for s in [None,fixture().model_copy(update={'geography_id':None}),fixture().model_copy(update={'observations':[]})]:
            r=execute(request(),s,'test-version',fixture_sources())
            self.assertEqual(r.status,'UNAVAILABLE');self.assertIsNone(r.baseline);self.assertEqual(r.results,[])

    def test_partial_and_quarantine_excluded_with_source_period_preserved(self):
        s=fixture(3);s.observations[-1].partial=True;s.observations[1].quality_status='QUARANTINED'
        r=execute(request(),s,'test-version',fixture_sources())
        self.assertEqual(r.baseline.observation_id,s.observations[0].observation_id)
        self.assertEqual(r.results[0].period,s.observations[0].period)
        for p in s.observations:p.quality_status='QUARANTINED'
        self.assertIsNone(baseline_for(s))

    def test_method_boundary_duplicate_and_native_unit_gates(self):
        s=fixture();s.applicability_end=s.observations[0].period_end
        self.assertEqual(baseline_for(s).observation_id,s.observations[0].observation_id)
        s.observations[-1].observation_id=s.observations[0].observation_id
        self.assertIsNone(baseline_for(s));self.assertIsNone(baseline_for(fixture(unit='unknown-unit')))

    def test_domain_exceedance_not_clipped(self):
        r=execute(request(1000),fixture(),'test-version',fixture_sources())
        self.assertEqual(r.status,'NOT_READY');self.assertEqual(r.reason_codes,['METRIC_DOMAIN_CONSTRAINT'])
        self.assertEqual(r.results,[])

    def test_zero_and_negative_assumption_edge_cases(self):
        s=fixture(3)
        r=execute(request(0),s,'test-version',fixture_sources());self.assertEqual(r.results[0].value,s.observations[-1].value)
        r=execute(request(-100),s,'test-version',fixture_sources());self.assertEqual(r.results[0].value,0)
        s.observations[-1].value=0;s.observations[-1].original_value='0'
        self.assertEqual(execute(request(30),s,'test-version',fixture_sources()).results[0].value,0)

    def test_validation_refuses_formulas_ids_ranges_and_nonfinite(self):
        for payload in [
            {'scenario_type':'SKILL_SHOCK','series_id':'test-series','assumption':{'kind':'AI_ADOPTION','change_percent':30,'formula':'eval(1)'}},
            {'scenario_type':'SKILL_SHOCK','series_id':'test-series','assumption':{'kind':'DIRECT_METRIC_CHANGE','change_percent':30}},
            {'scenario_type':'DIRECT_METRIC_SENSITIVITY','series_id':'','assumption':{'kind':'DIRECT_METRIC_CHANGE','change_percent':30}},
            {'scenario_type':'SKILL_SHOCK','series_id':'x'*121,'assumption':{'kind':'AI_ADOPTION','change_percent':30}},
        ]:
            with self.assertRaises(ValidationError):ScenarioRequest.model_validate(payload)
        for value in [float('nan'),float('inf'),-101,1001]:
            with self.assertRaises(ValidationError):request(value)

    def test_result_contract_rejects_forged_unavailable_output_and_lineage(self):
        valid=execute(request(),fixture(),'test-version',fixture_sources()).model_dump()
        for update in [{'status':'NOT_READY'},{'is_simulation':False},{'evidence':[]},{'disclosure':'Observed data'}]:
            with self.assertRaises(ValidationError):ScenarioResult.model_validate({**valid,**update})
        forged=json.loads(json.dumps(valid,default=str));forged['results'][0]['value']=999
        with self.assertRaises(ValidationError):ScenarioResult.model_validate(forged)

    def test_relationship_foundation_cannot_invent_authority(self):
        payload={'relationship_id':'TEST-ONLY','relationship_type':'TEST ONLY','source_entity':{'entity_type':'skill','entity_id':'test-a','label':'TEST ONLY'},
            'target_entity':{'entity_type':'skill','entity_id':'test-b','label':'TEST ONLY'},'source_id':None,'evidence':[],
            'status':'VERIFIED','relationship_origin':'INFERRED','confidence':None}
        with self.assertRaises(ValidationError):Relationship.model_validate(payload)
        payload.update(status='SIMULATED',relationship_origin='SIMULATED')
        self.assertEqual(Relationship.model_validate(payload).status,'SIMULATED')

    def test_source_and_native_identity_cannot_be_relabelled(self):
        s=fixture()
        for sources in [[],[{**fixture_sources()[0],'sha256':'b'*64}],[{**fixture_sources()[0],'version':'other'}],[{**fixture_sources()[0],'connected':False}]]:
            self.assertEqual(execute(request(),s,'test-version',sources).status,'UNAVAILABLE')
        for update in [{'geography_id':'wrong-geography'},{'classification':{'sex':'incompatible-population'}},{'methodology_version':'other-method'},{'source_ids':['OTHER-SOURCE']}]:
            self.assertEqual(execute(request(),s.model_copy(update=update),'test-version',fixture_sources()).status,'UNAVAILABLE')
        valid=execute(request(),s,'test-version',fixture_sources()).model_dump()
        valid['series']['geography_id']='wrong-geography'
        with self.assertRaises(ValidationError):ScenarioResult.model_validate(valid)

    def test_verified_relationship_requires_its_declared_source(self):
        payload={'relationship_id':'TEST-ONLY','relationship_type':'TEST ONLY','source_entity':{'entity_type':'skill','entity_id':'test-a','label':'TEST ONLY'},
            'target_entity':{'entity_type':'skill','entity_id':'test-b','label':'TEST ONLY'},'source_id':'OTHER-SOURCE','evidence':[fixture().observations[0].evidence.model_dump()],
            'status':'VERIFIED','relationship_origin':'EVIDENCED','confidence':None}
        with self.assertRaises(ValidationError):Relationship.model_validate(payload)

    def test_real_coverage_bounded_and_missing_geography_explicit(self):
        bundle=read_trends();c=coverage(bundle,limit=2)
        self.assertEqual(len(c['baseline_options']),2);self.assertGreater(c['baseline_total'],2)
        self.assertEqual(c['relationships_status'],'UNAVAILABLE')
        absent=coverage(bundle,'not-connected')
        self.assertEqual(absent['baseline_options'],[]);self.assertEqual(absent['status'],'EMPTY')
        self.assertEqual(absent['scenario_types'][0]['status'],'NOT_READY')
        self.assertEqual(absent['scenario_types'][0]['reason_codes'],['BASELINE_UNAVAILABLE'])
        self.assertFalse(any('district' in r['id'] for r in c['geographies']))

    def test_real_skill_shock_never_propagates_skill_or_forecast_values(self):
        bundle=read_trends();option=coverage(bundle)['baseline_options'][0]
        r=evaluate(bundle,request(kind='SKILL_SHOCK',series_id=option['series_id']))
        self.assertEqual(r.status,'NOT_READY');self.assertEqual(r.results,[]);self.assertEqual(r.relationships,[])
        q=quality(bundle);self.assertTrue(q['no_canonical_writes']);self.assertTrue(q['quality']['quarantined'])

    def test_api_public_post_and_unavailable_without_account_mutation(self):
        client=Client();code,c=client.request('GET','/api/v1/intelligence/scenarios/coverage')
        self.assertEqual(code,200);self.assertLessEqual(len(c['baseline_options']),100)
        payload=request(kind='SKILL_SHOCK',series_id=c['baseline_options'][0]['series_id']).model_dump()
        code,r=client.request('POST','/api/v1/intelligence/scenarios/skill-shock',payload)
        self.assertEqual(code,200);self.assertEqual(r['status'],'NOT_READY');self.assertTrue(r['is_simulation'])
        self.assertEqual(r['results'],[]);self.assertNotIn('token',r);self.assertNotIn('user_id',r)

    def test_api_validation_and_safe_failure(self):
        client=Client()
        self.assertEqual(client.request('GET','/api/v1/intelligence/scenarios/coverage?limit=101')[0],422)
        self.assertEqual(client.request('POST','/api/v1/intelligence/scenarios/skill-shock',{'formula':'__import__(os)'})[0],422)
        with patch('src.routes.scenarios.read_trends',side_effect=ValueError('secret/path')):
            code,r=client.request('GET','/api/v1/intelligence/scenarios/coverage')
            self.assertEqual(code,503);self.assertNotIn('secret/path',str(r));self.assertEqual(r['detail']['code'],'SCENARIO_BASELINE_UNAVAILABLE')

    def test_evaluation_failure_safe_no_mock_or_numerical_fallback(self):
        with patch('src.routes.scenarios.evaluate',side_effect=ValueError('secret/internal path')):
            code,r=Client().request('POST','/api/v1/intelligence/scenarios/skill-shock',request().model_dump())
            self.assertEqual(code,503);self.assertNotIn('secret/internal',str(r))
            self.assertEqual(r['detail']['code'],'SCENARIO_BASELINE_UNAVAILABLE');self.assertNotIn('results',r)


if __name__=='__main__':unittest.main()
