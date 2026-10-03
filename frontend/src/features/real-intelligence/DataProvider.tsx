import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../../services/api";
import { DataContext } from "./dataContext";
import { decodeCatalog, type Catalog } from "./contracts";

// Real is always the default. Legacy mode requires an explicit URL choice; never a failure fallback.
export function DataProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [result, setResult] = useState<{ key: string; catalog: Catalog | null; error: boolean } | null>(null); const [attempt, setAttempt] = useState(0);
  const mode = import.meta.env.DEV && new URLSearchParams(location.search).get("data") === "sample" ? "sample" : "real";
  const key = `${mode}:${attempt}`;
  const catalog = result?.key === key ? result.catalog : null; const error = result?.key === key ? result.error : false;
  useEffect(() => {
    if (mode !== "real") return;
    const controller = new AbortController();
    api.get("/v1/catalog", decodeCatalog, controller.signal).then(catalog => setResult({ key, catalog, error: false })).catch(() => { if (!controller.signal.aborted) setResult({ key, catalog: null, error: true }); });
    return () => controller.abort();
  }, [key, mode]);
  return <DataContext.Provider value={{ mode, catalog, error, retry: () => setAttempt(n => n + 1) }}>{children}</DataContext.Provider>;
}
