import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { decodeCoverage, decodeSupply, decodeCompatibility, type SupplyResponse, type SupplyCoverage, type Compatibility } from "./contracts";
export function useSupply(query: string) {
  const [attempt, retry] = useState(0), key = `${query}:${attempt}`;
  const [result, setResult] = useState<{ key: string; data?: SupplyResponse; coverage?: SupplyCoverage; compatibility?: Compatibility; failed?: boolean }>();
  useEffect(() => {
    const abort = new AbortController();
    Promise.all([api.get(`/v1/intelligence/supply?limit=1000&${query}`, decodeSupply, abort.signal), api.get("/v1/intelligence/supply/coverage", decodeCoverage, abort.signal), api.get("/v1/intelligence/compatibility", decodeCompatibility, abort.signal)])
      .then(([data, coverage, compatibility]) => { if (abort.signal.aborted) return; if (data.version !== coverage.version || data.version !== compatibility.version) throw new Error("Publication changed"); setResult({ key, data, coverage, compatibility }); })
      .catch(() => { if (!abort.signal.aborted) setResult({ key, failed: true }); });
    return () => abort.abort();
  }, [key, query]);
  return { ...(result?.key === key ? result : {}), retry: () => retry(n => n + 1) };
}
