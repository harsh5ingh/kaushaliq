"""Deterministic unit/time/geography and reviewed classification normalization."""
import calendar
import hashlib
import re
from datetime import date
from decimal import Decimal, InvalidOperation
from src.data_pipeline.build import region_key

VERSION='ncs-active-stock-1.0'

def stable_id(*parts):
    return hashlib.sha256('|'.join(str(part) for part in parts).encode()).hexdigest()[:32]

def normalize_count(raw,unit):
    factors={'vacancies':Decimal(1),'lakh vacancies':Decimal(100000),'crore vacancies':Decimal(10000000)}
    if unit not in factors: raise ValueError('Unsupported source unit')
    text=str(raw).strip()
    if ',' in text and not (re.fullmatch(r'\d{1,3}(?:,\d{3})+',text) or re.fullmatch(r'\d{1,2}(?:,\d{2})*,\d{3}',text)):
        raise ValueError('Invalid numeric grouping')
    try: value=Decimal(text.replace(',',''))*factors[unit]
    except InvalidOperation: raise ValueError('Invalid source number') from None
    if not value.is_finite() or value<0 or value!=value.to_integral_value() or value>Decimal(2**53-1):
        raise ValueError('Invalid integral bounded count')
    return int(value)

def normalize_period(label,kind):
    if kind=='POINT': start=end=date.fromisoformat(label)
    elif kind=='MONTH' and re.fullmatch(r'\d{4}-\d{2}',label):
        year,month=map(int,label.split('-'));start=date(year,month,1);end=date(year,month,calendar.monthrange(year,month)[1])
    elif kind=='QUARTER' and re.fullmatch(r'\d{4}-Q[1-4]',label):
        year=int(label[:4]);month=(int(label[-1])-1)*3+1;start=date(year,month,1);end=date(year,month+2,calendar.monthrange(year,month+2)[1])
    elif kind=='FISCAL_YEAR' and re.fullmatch(r'20\d{2}-\d{2}',label):
        year=int(label[:4])
        if label[-2:]!=str(year+1)[-2:]: raise ValueError('Incoherent fiscal year')
        start=date(year,4,1);end=date(year+1,3,31)
    elif kind=='CALENDAR_YEAR' and re.fullmatch(r'20\d{2}',label): start=date(int(label),1,1);end=date(int(label),12,31)
    else: raise ValueError('Explicit supported period semantics required')
    return {'reference_period':label,'period_type':kind,'period_start':start.isoformat(),'period_end':end.isoformat(),'observed_at':end.isoformat() if kind=='POINT' else None}

def mapping(dimension,label,evidence,source_code=None,source_system=None,target_system='NCO-2015',references=(),crosswalks=()):
    result={'mapping_id':stable_id(evidence['source_id'],evidence['locator'],dimension,label,source_code,source_system,target_system),'dimension':dimension,'source_label':label,'source_code':source_code,'source_system':source_system,'target_system':target_system,'target_code':None,'mapping_method':'none','status':'UNAVAILABLE' if not label and not source_code else 'UNMAPPED','confidence':'not_assessed','review_status':'NOT_APPLICABLE' if not label and not source_code else 'REQUIRES_REVIEW','evidence':evidence}
    verified=[r for r in references if r.get('evidence') and r.get('version')]
    exact=[r for r in verified if source_code and source_system==target_system and r['system']==target_system and r['code']==source_code]
    documented=[r for r in crosswalks if r.get('source_code')==source_code and r.get('source_label')==label and r.get('source_system')==source_system and r.get('target_system')==target_system]
    approved=[r for r in documented if r.get('review_status')=='APPROVED' and r.get('evidence') and any(v['code']==r['target_code'] and v['system']==target_system for v in verified)]
    targets={r['code'] for r in exact}|{r['target_code'] for r in approved}
    if len(targets)==1:
        result.update(target_code=next(iter(targets)),status='EXACT' if exact else 'DOCUMENTED',mapping_method='exact_code' if exact else 'documented_crosswalk',confidence='confirmed',review_status='APPROVED')
        result['evidence']=exact[0]['evidence'] if exact else approved[0]['evidence']
    elif len(targets)>1:result['status']='AMBIGUOUS'
    elif label:
        titles=[r for r in references if r['system']==target_system and str(r.get('label','')).casefold()==label.casefold()]
        if titles:result['status']='AMBIGUOUS' if len(titles)>1 else 'REQUIRES_REVIEW'
    return result

def normalize_geography(label,regions,evidence):
    # Never map legacy separate UT buckets into today's merged UT or distribute PAN-India values.
    identifier=region_key(label)
    region=next((r for r in regions if r['region_id']==identifier),None)
    result=mapping('geography',label,evidence,target_system='KaushalIQ geography reference')
    if region:
        exact=label.strip().casefold()==region['name'].casefold()
        result.update(target_code=identifier,status='EXACT' if exact else 'DOCUMENTED',mapping_method='exact_label' if exact else 'documented_crosswalk',confidence='confirmed',review_status='APPROVED')
    return region,result
