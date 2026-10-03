import copy
import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
from pydantic import ValidationError
from src.config import settings
from src.data_pipeline.acquire import DATA, acquire
from src.data_pipeline.build import digest
from src.data_pipeline.repository import read_snapshot
from src.demand.repository import read_demand
from src.supply.repository import read_supply
from src.supply import build as pipeline
from src.supply.models import SupplySignal, TaxonomySource, OccupationReference, SkillReference, QualificationReference, MappingRelationship
from src.supply.compatibility import assess
from test_accounts import Client


class SupplyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.snapshot,cls.version,_=read_supply();cls.base,cls.base_version=read_snapshot();cls.demand,_,_=read_demand()
        cls.sources={s['source_id']:s for s in cls.snapshot['sources']+cls.demand['sources']}
        cls.output=next(r for r in cls.snapshot['signals'] if r['geography_id']=='in' and r['metric']=='CERTIFIED' and r['reference_period']=='2025-26')
        cls.stock=next(r for r in cls.demand['signals'] if r['geography_id']=='in')

    def test_immutable_source_receipt_and_reproduction(self):
        source=next(s for s in self.snapshot['sources'] if s['source_id']=='pmkvy-centres-pib-2026')
        with patch('src.data_pipeline.acquire.urlopen',side_effect=AssertionError('No network')):
            receipt=acquire(source['source_id'],pipeline.REGISTRY)
        self.assertEqual(receipt['sha256'],digest(DATA/source['raw_path']))
        before=self.version;pipeline.build()
        self.assertEqual(digest(DATA/'canonical/supply/snapshot.json'),before)
        self.assertEqual(digest(DATA/'canonical/labour-market.json'),self.base_version)

    def test_exact_output_values_and_raw_cells_preserved(self):
        output=[r for r in self.snapshot['signals'] if r['semantic_category']=='TRAINING_OUTPUT'];self.assertEqual(len(output),287)
        expected={(r['region_id'],r['period'],r['indicator'].upper()):r['value'] for r in self.base['training']}
        for r in output:
            self.assertEqual(r['value'],expected[(r['geography_id'],r['reference_period'],r['metric'])])
            self.assertEqual(int(r['original_value'].replace(',','')),r['normalized_value'])
            self.assertEqual(r['original_unit'],'reported persons');self.assertEqual(r['unit'],'persons')
            self.assertEqual(r['status'],'OBSERVED')

    def test_centres_are_infrastructure_not_capacity_or_district(self):
        rows=[r for r in self.snapshot['signals'] if r['metric']=='TRAINING_CENTRES'];self.assertEqual(len(rows),36)
        ap=next(r for r in rows if r['geography_id']=='in-andhra-pradesh')
        self.assertEqual((ap['value'],ap['original_value']),(527,'527$'));self.assertIn('Konaseema',str(ap['evidence']))
        self.assertTrue(all(r['semantic_category']=='TRAINING_INFRASTRUCTURE' and r['unit']=='centres' for r in rows))
        self.assertFalse(any(r['geography_level'] in {'district','country'} for r in rows))
        self.assertEqual(self.snapshot['capacity']['status'],'UNAVAILABLE')
        self.assertFalse(any(r['metric'] in {'SEATS','CAPACITY'} for r in self.snapshot['signals']))

    def test_quarantined_total_cannot_enter_supply(self):
        self.assertEqual(self.snapshot['quality']['quarantined'][0]['difference'],120)
        self.assertFalse(any(r['geography_id']=='in' and r['reference_period']=='2024-25' and r['metric']=='TRAINED' for r in self.snapshot['signals']))
        altered=copy.deepcopy(self.snapshot);altered['signals'][0]['value']=2038319
        altered['signals'][0]['normalized_value']=2038319
        with self.assertRaises(ValueError):pipeline.validate(altered,self.base)

    def test_schema_values_units_time_and_classification(self):
        for changes in [{'value':-1},{'value':True},{'value':float('nan')},{'unit':'centres'},{'semantic_category':'TRAINING_CAPACITY'},{'period_start':'2025-01-01'},{'publication_date':'2020-01-01'},{'occupation_code':'not-a-code'}]:
            with self.subTest(changes=changes),self.assertRaises(ValidationError):SupplySignal.model_validate({**self.output,**changes})
        partial=next(r for r in self.snapshot['signals'] if r['partial']);self.assertEqual(partial['reference_period'],'2026-27');self.assertEqual(partial['period_end'],'2027-03-31');self.assertEqual(partial['as_of'],'2026-06-30')
        with self.assertRaises(ValidationError):SupplySignal.model_validate({**partial,'partial':False})

    def test_duplicate_geography_and_source_drift_fail_closed(self):
        for change in ['duplicate','district','evidence']:
            altered=copy.deepcopy(self.snapshot)
            if change=='duplicate':altered['signals'].append(altered['signals'][0])
            elif change=='district':altered['signals'][0]['geography_level']='district'
            else:altered['signals'][0]['evidence']['raw_sha256']='0'*64
            with self.subTest(change=change),self.assertRaises(ValueError):pipeline.validate(altered,self.base)
        source=next(s for s in self.snapshot['sources'] if s['source_id']=='pmkvy-centres-pib-2026')
        with patch('src.supply.build.html_tables',return_value=[[['changed header']]]):
            with self.assertRaises(ValueError):pipeline.infrastructure(source,self.base['regions'])

    def test_multi_system_references_keep_distinct_entity_types(self):
        # Isolated contract fixtures, never emitted by production ingestion.
        common={'taxonomy_system':'TEST-ONLY','taxonomy_version':'fixture-1','code':'fixture-code','title':'Isolated test reference','status':'REFERENCE_ONLY','source_id':self.output['source_id'],'provenance_id':'fixture','evidence':self.output['evidence']}
        occ=OccupationReference.model_validate({**common,'occupation_id':'fixture-occ'})
        skill=SkillReference.model_validate({**common,'skill_id':'fixture-nos','entity_type':'NOS'})
        qual=QualificationReference.model_validate({**common,'qualification_id':'fixture-qual','entity_type':'qualification','nsqf_level':None})
        self.assertEqual(occ.taxonomy_system,'TEST-ONLY');self.assertEqual(skill.entity_type,'NOS');self.assertEqual(qual.entity_type,'qualification')
        self.assertEqual(self.snapshot['occupations'],[]);self.assertEqual(self.snapshot['skills'],[]);self.assertEqual(self.snapshot['qualifications'],[])

    def test_mapping_statuses_no_related_or_ambiguous_equivalence(self):
        common={'mapping_id':'fixture','source_system':'TEST-A','source_version':'1','source_code':'a','source_label':'A','target_system':'TEST-B','target_version':'1','target_code':'b','target_label':'B','mapping_type':'DOCUMENTED_CROSSWALK','mapping_status':'DOCUMENTED','confidence':'confirmed','review_status':'APPROVED','methodology_version':'fixture','provenance_id':'fixture','evidence':self.output['evidence']}
        for status in ['EXACT','DOCUMENTED','PARTIAL','AMBIGUOUS','UNMAPPED','REQUIRES_REVIEW']:
            row={**common,'mapping_status':status}
            if status=='EXACT':row['mapping_type']='EXACT_EQUIVALENCE'
            if status=='PARTIAL':row['confidence']='partial'
            if status in {'AMBIGUOUS','UNMAPPED','REQUIRES_REVIEW'}:row.update(target_code=None,confidence='not_assessed',review_status='REQUIRES_REVIEW')
            self.assertEqual(MappingRelationship.model_validate(row).mapping_status,status)
        for changes in [{'mapping_status':'EXACT','mapping_type':'RELATED'},{'mapping_status':'AMBIGUOUS'},{'review_status':'REQUIRES_REVIEW'}]:
            with self.assertRaises(ValidationError):MappingRelationship.model_validate({**common,**changes})

    def test_taxonomy_source_status_requires_acquisition_evidence(self):
        source=next(r for r in self.snapshot['taxonomy_sources'] if r['taxonomy_source_id']=='nco-2015')
        self.assertEqual(TaxonomySource.model_validate(source).status,'REQUIRES_PERMISSION')
        with self.assertRaises(ValidationError):TaxonomySource.model_validate({**source,'status':'VERIFIED'})
        self.assertEqual(next(r for r in self.snapshot['taxonomy_sources'] if r['taxonomy_source_id']=='nic-2008')['snapshot_sha256'],next(r for r in self.snapshot['sources'] if r['source_id']=='nic-2008')['sha256'])

    def test_unreviewed_reference_cannot_publish_under_training_evidence(self):
        altered=copy.deepcopy(self.snapshot)
        altered['occupations']=[{'occupation_id':'fixture-only','taxonomy_system':'TEST-ONLY','taxonomy_version':'1','code':'fixture-only','title':'Not a production reference','status':'REFERENCE_ONLY','source_id':self.output['source_id'],'provenance_id':'fixture-only','evidence':self.output['evidence']}]
        with self.assertRaises(ValueError):pipeline.validate(altered,self.base)

    def test_coverage_and_quarantine_metadata_cannot_drift(self):
        for kind in ['coverage','quarantine','capacity']:
            altered=copy.deepcopy(self.snapshot)
            if kind=='coverage':altered['coverage'][0]['district']=1
            elif kind=='quarantine':altered['quality']['quarantined']=[]
            else:altered['capacity']['status']='AVAILABLE'
            with self.subTest(kind=kind),self.assertRaises(ValueError):pipeline.validate(altered,self.base)

    def test_active_vacancies_not_certified_persons_no_gap(self):
        result=assess(self.stock,self.output,self.sources)
        self.assertEqual(result['status'],'INCOMPATIBLE');self.assertIsNone(result['gap_value'])
        for code in ['UNIT_SEMANTICS_DIFFER','TIME_SEMANTICS_DIFFER','NO_OCCUPATION_MAPPING','VACANCY_STOCK_NOT_TRAINING_ACTIVITY']:self.assertIn(code,result['reason_codes'])
        self.assertEqual(result['gap_status'],'UNAVAILABLE');self.assertEqual(result['readiness'],'NOT_READY')

    def test_time_geography_source_and_partial_checks(self):
        row=next(r for r in self.snapshot['signals'] if r['geography_id']=='in-karnataka')
        result=assess(self.stock,row,self.sources);self.assertIn('GEOGRAPHY_DIFFERS',result['reason_codes'])
        result=assess(self.stock,self.output,{})
        self.assertIn('SOURCE_NOT_VERIFIED',result['reason_codes'])
        self.assertEqual(assess(None,self.output,self.sources)['status'],'UNAVAILABLE')
        altered={**self.output,'unit':'vacancies','period_type':'POINT','period_start':self.stock['period_start'],'period_end':self.stock['period_end']}
        result=assess(self.stock,altered,self.sources)
        self.assertEqual(result['status'],'INCOMPATIBLE');self.assertIsNone(result['gap_value'])

    def test_partial_related_relationships_never_make_gap_ready(self):
        # Contract fixtures only. Even an approved RELATED edge is not an equivalence.
        d={**self.stock,'occupation_code':'a','occupation_system':'TEST-A'};s={**self.output,'occupation_code':'b','occupation_system':'TEST-B'}
        m={'review_status':'APPROVED','mapping_status':'PARTIAL','mapping_type':'RELATED','source_code':'a','source_system':'TEST-A','target_code':'b','target_system':'TEST-B','evidence':self.output['evidence']}
        result=assess(d,s,self.sources,[m]);self.assertIn('CLASSIFICATION_NOT_EQUIVALENT',result['reason_codes']);self.assertIsNone(result['gap_value'])

    def test_api_filter_pagination_and_honest_missing(self):
        c=Client();code,r=c.request('GET','/api/v1/intelligence/supply?limit=1000');self.assertEqual(code,200);self.assertEqual(r['total'],323)
        _,r=c.request('GET','/api/v1/intelligence/supply?metric=TRAINING_CENTRES&geography_id=in-andhra-pradesh');self.assertEqual(r['items'][0]['value'],527)
        for query in ['geography_level=district','metric=CAPACITY','occupation_code=unmapped','geography_id=in&reference_period=2024-25&metric=TRAINED','geography_id=in-lakshadweep&metric=TRAINED','metric=TRAINING_CENTRES&reference_period=2025-26']:
            _,r=c.request('GET','/api/v1/intelligence/supply?'+query);self.assertEqual(r['items'],[]);self.assertEqual(r['status'],'UNAVAILABLE')
        self.assertEqual(c.request('GET','/api/v1/intelligence/supply?limit=1001')[0],422)

    def test_api_provenance_quality_coverage_and_taxonomy(self):
        c=Client()
        for route in ['sources','coverage','quality','taxonomies']:
            code,r=c.request('GET','/api/v1/intelligence/supply/'+route);self.assertEqual(code,200);self.assertNotIn('raw_path',json.dumps(r));self.assertNotIn(settings.auth_database_path,json.dumps(r))
        _,r=c.request('GET','/api/v1/intelligence/supply/taxonomies?kind=industry&limit=1000');self.assertEqual(r['total'],332);self.assertTrue(r['reference_only'])
        for kind in ['occupation','skill','qualification']:
            _,r=c.request('GET','/api/v1/intelligence/supply/taxonomies?kind='+kind);self.assertEqual(r['status'],'UNAVAILABLE');self.assertEqual(r['items'],[])
        _,r=c.request('GET','/api/v1/intelligence/supply/quality');self.assertEqual(r['quality']['quarantined'][0]['difference'],120)

    def test_api_compatibility_gap_and_missing_identifiers(self):
        c=Client()
        for route in ['compatibility','gap/status']:
            code,r=c.request('GET','/api/v1/intelligence/'+route);self.assertEqual(code,200);self.assertEqual(r['status'],'INCOMPATIBLE');self.assertIsNone(r['gap_value']);self.assertEqual(len(r['checks']),10)
        _,r=c.request('GET','/api/v1/intelligence/compatibility?supply_signal_id=nonexistent');self.assertEqual(r['status'],'UNAVAILABLE');self.assertIsNone(r['gap_value'])

    def test_broken_publication_no_fallback(self):
        with TemporaryDirectory() as directory,patch.object(settings,'supply_data_path',str(Path(directory)/'absent.json')):
            code,result=Client().request('GET','/api/v1/intelligence/supply');self.assertEqual(code,503);self.assertEqual(result['detail']['code'],'SUPPLY_PUBLICATION_UNAVAILABLE')


if __name__=='__main__':unittest.main()
