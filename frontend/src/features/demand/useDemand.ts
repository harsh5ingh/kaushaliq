import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { decodeDemand, decodeDemandCoverage, type DemandCoverage, type DemandResponse } from "./contracts";

export function useDemand(query: string) {
  const [attempt, retry] = useState(0);
  const key = `${query}:${attempt}`;
  const [result, setResult] = useState<{ key: string; data?: DemandResponse; coverage?: DemandCoverage; failed?: boolean }>();
  useEffect(() => {
    const abort = new AbortController();
    Promise.all([api.get(`/v1/intelligence/demand?${query}`, decodeDemand, abort.signal), api.get("/v1/intelligence/demand/coverage", decodeDemandCoverage, abort.signal)])
      .then(([data, coverage]) => {
        if (abort.signal.aborted) return;
        if (data.version !== coverage.version) throw new Error("Demand publication changed during query");
        setResult({ key, data, coverage });
      })
      .catch(() => { if (!abort.signal.aborted) setResult({ key, failed: true }); });
    return () => abort.abort();
  }, [key, query]);
  return { ...(result?.key === key ? result : {}), retry: () => retry(n => n + 1) };
}
