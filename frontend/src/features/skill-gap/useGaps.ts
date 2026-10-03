import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { decodeGaps, decodeGapCoverage, type GapResponse, type GapCoverage } from './contracts';

export function useGaps(query: string) {
  const [attempt,setAttempt] = useState(0), key = `${query}:${attempt}`;
  const [response,setResponse] = useState<{key:string; data?:GapResponse; failed?:boolean}>();
  const [coverage,setCoverage] = useState<{attempt:number; data?:GapCoverage; failed?:boolean}>();
  useEffect(() => {
    const controller = new AbortController();
    api.get(`/v1/intelligence/gaps?${query}`,decodeGaps,controller.signal).then(data => {
      if(!controller.signal.aborted) setResponse({key,data});
    }).catch(() => { if(!controller.signal.aborted) setResponse({key,failed:true}); });
    return () => controller.abort();
  },[query,key]);
  useEffect(() => {
    const controller = new AbortController();
    api.get('/v1/intelligence/gaps/coverage',decodeGapCoverage,controller.signal).then(data => {
      if(!controller.signal.aborted) setCoverage({attempt,data});
    }).catch(() => { if(!controller.signal.aborted) setCoverage({attempt,failed:true}); });
    return () => controller.abort();
  },[attempt]);
  const current = response?.key === key ? response : undefined, meta = coverage?.attempt === attempt ? coverage : undefined;
  const failed = current?.failed || meta?.failed || (current?.data && meta?.data && current.data.version !== meta.data.version);
  return {data:failed ? undefined : current?.data, coverage:failed ? undefined : meta?.data, failed:!!failed, retry:() => setAttempt(n => n+1)};
}
