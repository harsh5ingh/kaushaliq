import {useEffect,useState} from 'react';
import {api} from '../../services/api';
import {decodeWarningCoverage,decodeWarnings,type WarningCoverage,type WarningResponse} from './contracts';
export function useEarlyWarning(query:string){const [attempt,setAttempt]=useState(0),key=`${query}:${attempt}`;const [result,setResult]=useState<{key:string;data?:WarningResponse;failed?:true}>(),[meta,setMeta]=useState<{attempt:number;coverage?:WarningCoverage;failed?:true}>();
  useEffect(()=>{const c=new AbortController();api.get(`/v1/intelligence/early-warning?${query}`,decodeWarnings,c.signal).then(data=>{if(!c.signal.aborted)setResult({key,data});}).catch(()=>{if(!c.signal.aborted)setResult({key,failed:true});});return()=>c.abort();},[query,key]);
  useEffect(()=>{const c=new AbortController();api.get('/v1/intelligence/early-warning/coverage',decodeWarningCoverage,c.signal).then(coverage=>{if(!c.signal.aborted)setMeta({attempt,coverage});}).catch(()=>{if(!c.signal.aborted)setMeta({attempt,failed:true});});return()=>c.abort();},[attempt]);
  const current=result?.key===key?result:undefined,coverage=meta?.attempt===attempt?meta.coverage:undefined,failed=!!(current?.failed||meta?.attempt===attempt&&meta.failed||current?.data&&coverage&&(current.data.version!==coverage.version||current.data.engine_version!==coverage.engine_version));
  return{data:failed?undefined:current?.data,coverage,failed,retry:()=>setAttempt(n=>n+1)};
}
