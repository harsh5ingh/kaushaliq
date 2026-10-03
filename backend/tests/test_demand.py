import copy
import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
from pydantic import ValidationError
from src.config import settings
from src.data_pipeline.acquire import acquire, DATA
from src.data_pipeline.build import digest, html_tables, read_sources
from src.data_pipeline.repository import read_snapshot
from src.demand import build as pipeline
from src.demand.models import DemandSignal, TaxonomyMapping
from src.demand.normalize import mapping, normalize_count, normalize_period
from src.demand.repository import read_demand
from test_accounts import Client


class DemandTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.snapshot,cls.version,_=read_demand()
        cls.base,cls.base_version=read_snapshot()
        cls.source=next(s for s in cls.snapshot['sources'] if s['connected'])

    def test_real_source_snapshot_receipt_and_cached_acquisition(self):
        with patch('src.data_pipeline.acquire.urlopen',side_effect=AssertionError('Unexpected network')):
            for source in self.snapshot['sources']:
                receipt=acquire(source['source_id'],pipeline.REGISTRY)
                self.assertEqual(receipt['sha256'],digest(DATA/source['raw_path']))
        self.assertEqual(self.source['publication_date'],'2025-07-24')
        self.assertEqual(self.source['observation_period'],'2025-07-14')

    def test_exact_published_counts_and_no_employer_substitution(self):
        rows=self.snapshot['signals'];values={s['source_geography_label']:s['value'] for s in rows}
        self.assertEqual(len(rows),37)
        for label,value in [('Total',4005028),('Karnataka',22361),('West Bengal',62855),('Multiple States',1613586),('State not specified',2056384),('Daman and Diu',6)]: self.assertEqual(values[label],value)
        self.assertEqual(sum(s['value'] for s in rows if s['geography_id']!='in'),values['Total'])
        self.assertTrue(all(s['status']=='OBSERVED' and s['unit']=='vacancies' for s in rows))

    def test_no_zero_imputation_downscaling_or_classification_invention(self):
        self.assertEqual(len(self.snapshot['quality']['quarantined']),3)
        self.assertFalse(any(s['geography_level']=='district' or s['value']==0 for s in self.snapshot['signals']))
        self.assertIsNone(next(s for s in self.snapshot['signals'] if s['source_geography_label']=='Daman and Diu')['geography_id'])
        self.assertFalse(any(s['geography_id']=='in-dadra-and-nagar-haveli-and-daman-and-diu' for s in self.snapshot['signals']))
        self.assertTrue(all(s['occupation_code'] is None and s['skill_code'] is None and s['sector_code'] is None and s['direction'] is None for s in self.snapshot['signals']))
        self.assertTrue(all(s['mapping_status']=='UNAVAILABLE' for s in self.snapshot['signals']))

    def test_unit_normalization_preserves_original_and_rejects_invalid(self):
        self.assertEqual(normalize_count('40,05,028','vacancies'),4005028)
        self.assertEqual(normalize_count('1.25','lakh vacancies'),125000)
        self.assertEqual(normalize_count('0.1','crore vacancies'),1000000)
        for value,unit in [('-', 'vacancies'),('NaN','vacancies'),('-1','vacancies'),('1.5','vacancies'),('1,23,45','vacancies'),('10','persons'),(str(2**53),'vacancies')]:
            with self.subTest(value=value),self.assertRaises(ValueError):normalize_count(value,unit)

    def test_explicit_time_semantics_not_publication_date(self):
        for label,kind,start,end in [('2025-07-14','POINT','2025-07-14','2025-07-14'),('2024-02','MONTH','2024-02-01','2024-02-29'),('2024-Q1','QUARTER','2024-01-01','2024-03-31'),('2023-24','FISCAL_YEAR','2023-04-01','2024-03-31')]:
            p=normalize_period(label,kind);self.assertEqual((p['period_start'],p['period_end']),(start,end))
        for label,kind in [('2023-25','FISCAL_YEAR'),('2024-Q5','QUARTER'),('2024-13','MONTH')]:
            with self.assertRaises(ValueError):normalize_period(label,kind)
        self.assertNotEqual(self.snapshot['signals'][0]['observed_at'],self.snapshot['signals'][0]['publication_date'])

    def test_duplicate_and_invalid_records_are_quarantined(self):
        row={'source_record_id':'fixture:1','label':'Karnataka','original_value':'bad','original_unit':'vacancies'}
        signals,_,quarantine=pipeline.normalize_rows([row,row],self.source,self.base['regions'])
        self.assertEqual(signals,[]);self.assertEqual([r['reason'] for r in quarantine],['INVALID_VALUE_OR_UNIT','DUPLICATE_SOURCE_RECORD'])

    def test_source_schema_and_conflicting_responsive_tables_fail_closed(self):
        original=html_tables(self.source)
        changed=copy.deepcopy(original)
        candidates=[t for t in changed if t and t[0]==pipeline.HEADER];candidates[0][1][3]='99'
        with patch('src.demand.build.html_tables',return_value=changed),self.assertRaises(ValueError):pipeline.extract(self.source)
        with patch('src.demand.build.html_tables',return_value=[]),self.assertRaises(ValueError):pipeline.extract(self.source)

    def test_authoritative_mapping_requires_reference_evidence_not_titles(self):
        ev=self.snapshot['signals'][0]['evidence']
        # Isolated fixtures test rules; these never enter the production publication.
        reference={'system':'NCO-2015','code':'2512.0100','label':'Software Developer','version':'test fixture','evidence':ev}
        exact=mapping('occupation','Software Developer',ev,'2512.0100','NCO-2015',references=[reference]);self.assertEqual(exact['status'],'EXACT')
        title=mapping('occupation','Software Developer',ev,references=[reference]);self.assertEqual(title['status'],'REQUIRES_REVIEW');self.assertIsNone(title['target_code'])
        absent=mapping('occupation','Unknown role',ev,references=[reference]);self.assertEqual(absent['status'],'UNMAPPED')
        bad=reference.copy();bad.pop('evidence')
        self.assertEqual(mapping('occupation','Role',ev,'2512.0100','NCO-2015',references=[bad])['status'],'UNMAPPED')
        second=reference|{'code':'2512.0200'}
        ambiguous=mapping('occupation','Software Developer',ev,references=[reference,second]);self.assertEqual(ambiguous['status'],'AMBIGUOUS');self.assertIsNone(ambiguous['target_code'])
        cross={'source_label':'Role A','source_code':'A','source_system':'Source taxonomy','target_system':'NCO-2015','target_code':reference['code'],'review_status':'APPROVED','evidence':ev}
        self.assertEqual(mapping('occupation','Role A',ev,'A','Source taxonomy',references=[reference],crosswalks=[cross])['status'],'DOCUMENTED')
        self.assertEqual(mapping('occupation','Role A',ev,'A','Source taxonomy',references=[reference,second],crosswalks=[cross,cross|{'target_code':second['code']}])['status'],'AMBIGUOUS')

    def test_schema_and_provenance_reject_invalid_publication(self):
        for key,value in [('value',-1),('value',float('nan')),('unit','jobs'),('period_end','2020-01-01'),('publication_date','2020-01-01'),('status','FORECAST')]:
            with self.subTest(key=key),self.assertRaises(ValidationError):DemandSignal.model_validate(self.snapshot['signals'][0]|{key:value})
        relation=self.snapshot['mappings'][0]
        with self.assertRaises(ValidationError):TaxonomyMapping.model_validate(relation|{'status':'UNMAPPED','target_code':'invented'})
        for alteration in ['duplicate','geography','provenance','mapping','normalized']:
            bad=copy.deepcopy(self.snapshot)
            if alteration=='duplicate':bad['signals'].append(bad['signals'][0])
            if alteration=='geography':bad['signals'][0]['geography_id']='invented'
            if alteration=='provenance':bad['signals'][0]['evidence']['raw_sha256']='0'*64
            if alteration=='mapping':bad['signals'][0]['mapping_ids']=[]
            if alteration=='normalized':bad['signals'][0]['value']+=1
            with self.subTest(alteration=alteration),self.assertRaises(ValueError):pipeline.validate(bad,self.base)

    def test_reproducible_separate_publication_and_base_preservation(self):
        before=digest(DATA/'canonical/labour-market.json')
        with TemporaryDirectory() as directory:
            first=pipeline.build(Path(directory));second=pipeline.build(Path(directory));self.assertEqual(first,second);self.assertEqual(first['sha256'],self.version)
        self.assertEqual(before,self.base_version);self.assertEqual(digest(DATA/'canonical/labour-market.json'),before)

    def test_public_api_filters_pagination_and_no_private_paths(self):
        client=Client();code,result=client.request('GET','/api/v1/intelligence/demand');self.assertEqual(code,200);self.assertEqual(result['total'],37)
        code,result=client.request('GET','/api/v1/intelligence/demand?geography_id=in-karnataka');self.assertEqual(result['total'],1);self.assertEqual(result['items'][0]['value'],22361)
        code,result=client.request('GET','/api/v1/intelligence/demand?geography_level=state&reference_period=2025-07-14&quality_status=VALID');self.assertTrue(result['total']>0)
        self.assertTrue(all(s['geography_level']=='state' for s in result['items']))
        code,result=client.request('GET','/api/v1/intelligence/demand?limit=2&offset=1');self.assertEqual(len(result['items']),2);self.assertEqual(result['total'],37)
        self.assertEqual(client.request('GET','/api/v1/intelligence/demand?limit=1001')[0],422)
        for route in ['sources','coverage','quality','geographies','occupations']:
            code,result=client.request('GET','/api/v1/intelligence/demand/'+route);self.assertEqual(code,200)
            serialized=json.dumps(result);self.assertNotIn('raw_path',serialized);self.assertNotIn(settings.auth_database_path,serialized);self.assertNotIn('JWT_SECRET',serialized)

    def test_unsupported_combinations_and_no_forecast_gap_fallback(self):
        client=Client()
        for query in ['geography_level=district','occupation_code=2512.0100','skill_code=python','sector_code=62','reference_period=2026-01','geography_id=in-karnataka&geography_level=country','source_id=PLFS','metric=demand_score']:
            code,result=client.request('GET','/api/v1/intelligence/demand?'+query);self.assertEqual(code,200);self.assertEqual(result['items'],[]);self.assertEqual(result['status'],'UNAVAILABLE')
            self.assertEqual(result['forecast']['status'],'UNAVAILABLE');self.assertEqual(result['supply_gap']['status'],'UNAVAILABLE')

    def test_corrupt_missing_or_wrong_base_fails_closed(self):
        with TemporaryDirectory() as directory:
            path=Path(directory)/'snapshot.json';path.write_bytes((DATA/'canonical/demand/snapshot.json').read_bytes());path.with_name('manifest.json').write_text(json.dumps({'sha256':'wrong','base_version':self.base_version}))
            with patch.object(settings,'demand_data_path',str(path)):
                self.assertEqual(Client().request('GET','/api/v1/intelligence/demand')[0],503)
            with patch.object(settings,'demand_data_path',str(Path(directory)/'absent.json')):
                self.assertEqual(Client().request('GET','/api/v1/intelligence/demand')[0],503)

    def test_machine_coverage_is_connected_not_reference_inference(self):
        ncs=self.snapshot['coverage'][0];self.assertEqual((ncs['national_records'],ncs['state_records'],ncs['district_records']),(1,33,0))
        self.assertEqual(ncs['district'],'UNAVAILABLE')
        self.assertEqual(self.snapshot['quality']['mapping_counts']['geography']['UNMAPPED'],3)
        for dim in ['occupation','skill','sector']:self.assertEqual(self.snapshot['quality']['mapping_counts'][dim]['UNAVAILABLE'],37)

    def test_future_status_envelope_does_not_label_other_kinds_observed(self):
        # Response-contract fixtures only; no derived/scenario dataset is published.
        snapshot,version,indexes=read_demand()
        altered=copy.deepcopy(snapshot)
        for row in altered['signals']:row['status']='DERIVED'
        with patch('src.routes.demand.published',return_value=(altered,version,indexes)):
            code,result=Client().request('GET','/api/v1/intelligence/demand')
            self.assertEqual(code,200);self.assertEqual(result['status'],'DERIVED')
        altered['signals'][0]['status']='OBSERVED'
        with patch('src.routes.demand.published',return_value=(altered,version,indexes)):
            self.assertEqual(Client().request('GET','/api/v1/intelligence/demand')[1]['status'],'MIXED')


if __name__=='__main__':unittest.main()
