import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { decodeCoverage,decodeForecast,decodeTrends,type Coverage,type Forecast,type Trend,type Response } from './contracts';
export function useForecast(query:string,horizon:number){
  const [attempt,setAttempt]=useState(0),key=`${query}:${horizon}:${attempt}`;
  const [result,setResult]=useState<{key:string;history:Response<Trend>;forecast:Response<Forecast>} | {key:string;failed:true}>();
  const [meta,setMeta]=useState<{attempt:number;coverage?:Coverage;failed?:true}>();
  useEffect(()=>{const c=new AbortController();Promise.all([
    api.get(`/v1/intelligence/trends?${query}`,decodeTrends,c.signal),api.get(`/v1/intelligence/forecast?${query}&horizon=${horizon}`,decodeForecast,c.signal)
  ]).then(([history,forecast])=>{if(!c.signal.aborted)setResult({key,history,forecast});}).catch(()=>{if(!c.signal.aborted)setResult({key,failed:true});});return()=>c.abort();},[query,horizon,key]);
  useEffect(()=>{const c=new AbortController();api.get('/v1/intelligence/forecast/coverage',decodeCoverage,c.signal).then(coverage=>{if(!c.signal.aborted)setMeta({attempt,coverage});}).catch(()=>{if(!c.signal.aborted)setMeta({attempt,failed:true});});return()=>c.abort();},[attempt]);
  const current=result?.key===key?result:undefined,coverage=meta?.attempt===attempt?meta.coverage:undefined;
  const ready=current&&'history' in current?current:undefined;
  const mismatch=ready&&coverage&&(ready.history.version!==ready.forecast.version||ready.history.version!==coverage.version||ready.history.items[0]?.series.series_id!==ready.forecast.items[0]?.series.series_id);
  const failed=!!(current&&'failed' in current||meta?.attempt===attempt&&meta.failed||mismatch);
  return {history:failed?undefined:ready?.history,forecast:failed?undefined:ready?.forecast,coverage,failed,retry:()=>setAttempt(n=>n+1)};
}
