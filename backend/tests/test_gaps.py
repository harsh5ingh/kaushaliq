"""Synthetic compatible measurements exist ONLY in these isolated engine tests."""
import copy
from datetime import date
import unittest
from unittest.mock import patch
from pydantic import ValidationError
from src.gaps.models import GapMeasure, GapResult, CalculationMethod
from src.gaps.engine import calculate, APPROVED_METHODS
from src.gaps.repository import context, assessments
from test_accounts import Client


def fixture():
    evidence = {'source_id':'TEST-ONLY','locator':'isolated fixture','raw_sha256':'a'*64,'transformations':['test normalization']}
    sources = {'TEST-ONLY':{'connected':True,'version':'test-1','sha256':'a'*64}}
    classification = {'code':'TEST-SKILL','system':'TEST-TAXONOMY','version':'test-1','mapping_status':'EXACT','evidence':evidence}
    row = dict(signal_id='test-demand', source_id='TEST-ONLY', source_record_id='test-record', provenance_id='test-provenance',
        source_version='test-1', publication_version='test-publication', reference_period='2024', period_start='2024-01-01',
        period_end='2024-12-31', period_type='CALENDAR_YEAR', publication_date='2025-01-01', geography_id='test-geography',
        geography_level='state', source_geography_label='TEST ONLY', geography_mapping_status='EXACT', geography_version='test-geo-1',
        metric='TEST_REQUIRED', semantic_category='TEST_COMPARABLE_REQUIRED', population='test population', value=100.0, normalized_value=100.0,
        unit='test-compatible-persons', original_value='100', original_unit='test-compatible-persons', status='OBSERVED', quality_status='VALID',
        classifications={'skill':classification}, coverage_fraction=1.0, coverage_population='test population', coverage_evidence=evidence,
        methodology_version='test-normalization-1', evidence=evidence)
    d = GapMeasure.model_validate(row)
    s = GapMeasure.model_validate({**row, 'signal_id':'test-supply', 'metric':'TEST_AVAILABLE', 'semantic_category':'TEST_COMPARABLE_AVAILABLE',
                                   'value':64.0,'normalized_value':64.0,'original_value':'64'})
    method = CalculationMethod(method_id='TEST-ONLY-METHOD',version='test-1',approved=True,demand_metric=d.metric,supply_metric=s.metric,
        demand_semantics=d.semantic_category,supply_semantics=s.semantic_category,demand_population=d.population,supply_population=s.population,
        unit=d.unit,dimensions=['skill','geography'],required_classifications=['skill'],source_versions={'TEST-ONLY':'test-1'},
        methodology='Isolated arithmetic test, not labour-market evidence.',limitations=['TEST ONLY'],evidence=evidence)
    return d, s, sources, method


class GapTests(unittest.TestCase):
    def run_pair(self,d=None,s=None,sources=None,method=None,**kwargs):
        a,b,c,m=fixture()
        return calculate(d or a,s or b,c if sources is None else sources,methods=[method or m],**kwargs)

    def test_ready_arithmetic_and_provenance(self):
        r=self.run_pair()
        self.assertEqual((r.readiness,r.gap_value,r.uncovered_amount,r.coverage_ratio),('READY',36,36,.64))
        self.assertEqual(r.gap_direction,'SHORTFALL');self.assertEqual(r.gap_status,'DERIVED')
        self.assertEqual(r.demand.original_value,'100');self.assertEqual(r.supply.original_value,'64')
        self.assertTrue(all(e.raw_sha256=='a'*64 for e in r.evidence));self.assertIn('gap = demand - supply',r.transformations)
        self.assertEqual(r,self.run_pair());self.assertEqual(len(r.checks),13)

    def test_surplus_balanced_and_zero_demand(self):
        d,s,_,_=fixture()
        for dv,sv,gap,ratio,direction in [(100,120,-20,1.2,'SURPLUS'),(64,64,0,1,'BALANCED'),(0,64,-64,None,'SURPLUS'),(0,0,0,None,'BALANCED')]:
            r=self.run_pair(d=d.model_copy(update={'value':float(dv),'normalized_value':float(dv)}),s=s.model_copy(update={'value':float(sv),'normalized_value':float(sv)}))
            self.assertEqual((r.gap_value,r.coverage_ratio,r.gap_direction),(gap,ratio,direction));self.assertEqual(r.uncovered_amount,max(gap,0))
            if dv==0:self.assertIn('ZERO_DEMAND_DENOMINATOR',r.quality_flags)

    def test_no_method_or_conflicting_method_is_not_ready(self):
        d,s,sources,m=fixture()
        for methods in [[],[m,m],[m.model_copy(update={'approved':False})]]:
            r=calculate(d,s,sources,methods=methods);self.assertEqual(r.readiness,'NOT_READY');self.assertIsNone(r.gap_value)
        self.assertEqual(APPROVED_METHODS,())

    def test_incompatible_semantics_units_period_geography_granularity(self):
        d,s,_,_=fixture()
        for change in [{'semantic_category':'TRAINING_OUTPUT'},{'unit':'centres'},{'period_type':'CUMULATIVE'},
                       {'period_start':date(2024,2,1)},{'partial':True},{'geography_id':'different'},{'geography_level':'district'},
                       {'geography_version':'another-base'}]:
            with self.subTest(change=change):
                r=self.run_pair(s=s.model_copy(update=change));self.assertEqual(r.readiness,'NOT_READY');self.assertIsNone(r.gap_value)

    def test_partial_missing_coverage_never_calculates(self):
        _,s,_,_=fixture()
        for change in [{'coverage_fraction':.8},{'coverage_evidence':None},{'coverage_population':'different'}]:
            r=self.run_pair(s=s.model_copy(update=change));self.assertEqual(r.readiness,'PARTIAL');self.assertIsNone(r.coverage_ratio);self.assertIsNone(r.gap_value)

    def test_missing_skill_occupation_sector_and_versions(self):
        d,s,_,m=fixture()
        for dimension,code in [('skill','NO_SKILL_MAPPING'),('occupation','NO_OCCUPATION_MAPPING'),('industry','NO_SECTOR_MAPPING')]:
            method=m.model_copy(update={'dimensions':[dimension]})
            r=self.run_pair(d=d.model_copy(update={'classifications':{}}),method=method,dimension=dimension)
            self.assertIn(code,r.reason_codes);self.assertNotEqual(r.readiness,'READY')
        cls=copy.deepcopy(s.classifications);cls['skill']=cls['skill'].model_copy(update={'version':None})
        r=self.run_pair(s=s.model_copy(update={'classifications':cls}));self.assertIn('TAXONOMY_VERSION_UNAVAILABLE',r.reason_codes)

    def test_unreviewed_codes_and_title_similarity_do_not_map(self):
        _,s,_,_=fixture()
        for change in [{'code':'similar title'},{'mapping_status':'AMBIGUOUS'},{'mapping_status':'UNMAPPED'},{'mapping_status':'REQUIRES_REVIEW'},{'evidence':None}]:
            cls={'skill':s.classifications['skill'].model_copy(update=change)}
            r=self.run_pair(s=s.model_copy(update={'classifications':cls}));self.assertNotEqual(r.readiness,'READY');self.assertIsNone(r.gap_value)

    def test_documented_crosswalk_preserves_mapping_evidence(self):
        d,s,sources,m=fixture();s=s.model_copy(update={'classifications':{'skill':s.classifications['skill'].model_copy(update={'code':'TEST-TARGET'})}})
        mapping=dict(mapping_id='test-crosswalk',source_system='TEST-TAXONOMY',source_version='test-1',source_code='TEST-SKILL',source_label=None,
            target_system='TEST-TAXONOMY',target_version='test-1',target_code='TEST-TARGET',target_label=None,mapping_type='DOCUMENTED_CROSSWALK',
            mapping_status='DOCUMENTED',confidence='confirmed',review_status='APPROVED',methodology_version='test-crosswalk-1',provenance_id='test-map-provenance',evidence=d.evidence.model_dump())
        r=calculate(d,s,sources,methods=[m],mappings=[mapping]);self.assertEqual(r.readiness,'READY');self.assertIn('mapping test-crosswalk / test-crosswalk-1',r.transformations)
        for change in [{'target_version':'wrong'},{'mapping_type':'RELATED'},{'confidence':'partial'},{'review_status':'REQUIRES_REVIEW'}]:
            r=calculate(d,s,sources,methods=[m],mappings=[{**mapping,**change}]);self.assertNotEqual(r.readiness,'READY')

    def test_quality_flags_quarantine_estimates_scenarios_fail_closed(self):
        _,s,_,_=fixture()
        for change in [{'quality_status':'WARNING','quality_flags':['source discrepancy']},{'quality_flags':['unresolved input flag']},{'quality_status':'QUARANTINED'}, {'status':'ESTIMATED'},{'status':'SCENARIO'}]:
            r=self.run_pair(s=s.model_copy(update=change));self.assertEqual(r.readiness,'NOT_READY');self.assertIsNone(r.gap_value)
            for flag in change.get('quality_flags',[]):self.assertIn(flag,r.quality_flags)

    def test_sources_versions_hashes_and_method_evidence(self):
        d,s,sources,m=fixture()
        for source in [{}, {'TEST-ONLY':{**sources['TEST-ONLY'],'sha256':'b'*64}}, {'TEST-ONLY':{**sources['TEST-ONLY'],'connected':False}}, {'TEST-ONLY':{**sources['TEST-ONLY'],'version':'changed'}}]:
            r=calculate(d,s,source,methods=[m]);self.assertNotEqual(r.readiness,'READY');self.assertIsNone(r.gap_value)
        r=self.run_pair(method=m.model_copy(update={'source_versions':{'TEST-ONLY':'wrong'}}));self.assertEqual(r.readiness,'NOT_READY')

    def test_invalid_schema_and_forged_arithmetic_rejected(self):
        d,_,_,_=fixture()
        for change in [{'value':-1},{'value':float('nan')},{'value':True},{'value':2**53},{'period_end':'2020-01-01'},{'normalized_value':9},{'coverage_fraction':1.1}]:
            with self.subTest(change=change),self.assertRaises(ValidationError):GapMeasure.model_validate({**d.model_dump(),**change})
        r=self.run_pair().model_dump()
        for change in [{'gap_value':999},{'coverage_ratio':9},{'readiness':'NOT_READY'},{'method_id':None}]:
            with self.assertRaises(ValidationError):GapResult.model_validate({**r,**change})

    def test_missing_observation_is_unavailable_not_zero(self):
        d,_,sources,_=fixture()
        r=calculate(d,None,sources);self.assertEqual(r.gap_status,'UNAVAILABLE');self.assertEqual(r.readiness,'NOT_READY');self.assertIsNone(r.gap_value)

    def test_real_publication_no_calculations_or_quarantine(self):
        ctx=context();rows=assessments(ctx['demand_version'],ctx['supply_version'],ctx['base_version'],'skill')
        self.assertTrue(rows);self.assertTrue(all(r['readiness']=='NOT_READY' and r['gap_value'] is None for r in rows))
        self.assertFalse(any(r['supply']['geography_id']=='in' and r['supply']['metric']=='TRAINED' and r['supply']['reference_period']=='2024-25' for r in rows))
        self.assertTrue(all(r['demand']['evidence']['raw_sha256'] and r['supply']['evidence']['raw_sha256'] for r in rows))

    def test_api_filters_evidence_and_public_isolation(self):
        c=Client();code,r=c.request('GET','/api/v1/intelligence/gaps?geography_id=in');self.assertEqual(code,200)
        self.assertEqual(r['status'],'NOT_READY');self.assertEqual(r['calculated_total'],0);self.assertTrue(r['items'])
        item=r['items'][0];code,e=c.request('GET','/api/v1/intelligence/gaps/evidence?result_id='+item['result_id']);self.assertEqual(code,200);self.assertEqual(e['item'],item)
        self.assertNotIn('raw_path',str(e));self.assertNotIn('auth.sqlite',str(e));self.assertNotIn('resume',str(e))
        for query in ['geography_level=district','occupation_code=not-connected','skill_code=not-connected','sector_code=not-connected','reference_period=2025','readiness=READY','gap_direction=SHORTFALL']:
            _,r=c.request('GET','/api/v1/intelligence/gaps?'+query);self.assertEqual(r['status'],'EMPTY');self.assertEqual(r['items'],[])
        for query in ['dimension=unknown','limit=501','readiness=unknown','geography_id='+'x'*121]:self.assertEqual(c.request('GET','/api/v1/intelligence/gaps?'+query)[0],422)
        self.assertEqual(c.request('GET','/api/v1/intelligence/gaps/evidence?result_id=absent')[0],404)
        _,r=c.request('GET','/api/v1/intelligence/gaps?approved=true&user_id=untrusted');self.assertEqual(r['status'],'NOT_READY');self.assertEqual(r['calculated_total'],0)

    def test_coverage_quality_and_no_fallback_on_error(self):
        c=Client();_,r=c.request('GET','/api/v1/intelligence/gaps/coverage');self.assertEqual(r['options']['reference_period'],[])
        self.assertEqual(r['options']['skill_code'],[]);self.assertTrue(all(i['gap_status']=='UNAVAILABLE' for i in r['items']))
        self.assertEqual(r['quarantined_count_discrepancy'][0]['difference'],120)
        _,q=c.request('GET','/api/v1/intelligence/gaps/quality');self.assertEqual(q['calculated_count'],0);self.assertFalse(q['quarantined_records_used'])
        with patch('src.routes.gaps.context',side_effect=ValueError('private filesystem details')):
            code,r=c.request('GET','/api/v1/intelligence/gaps');self.assertEqual(code,503);self.assertNotIn('private filesystem',str(r))


if __name__=='__main__':unittest.main()
