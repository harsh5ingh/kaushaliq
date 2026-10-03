import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { decodeDemand, decodeDemandCoverage, type DemandSignal } from "./contracts";
import type { Source } from "../real-intelligence/contracts";

export interface DemandSnapshot {
  observation: DemandSignal;
  source: Source;
  matchedRegions: number;
  observedRecords: number;
  sources: Source[];
}
type SnapshotState = { status: "loading" | "error" | "unavailable"; data?: never } | { status: "ready"; data: DemandSnapshot };

function decodeSources(value: unknown): Source[] {
  if (!value || typeof value !== "object" || !("items" in value) || !Array.isArray(value.items)) throw new Error("Invalid source listing");
  for (const source of value.items) {
    if (!source || typeof source !== "object" || typeof source.source_id !== "string" || typeof source.connected !== "boolean" || typeof source.url !== "string") throw new Error("Invalid source metadata");
  }
  return value.items as Source[];
}
function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

/** A single historical stock and its same-publication coverage; never a live demand estimate. */
export function useDemandSnapshot() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<SnapshotState>({ status: "loading" });
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      api.get("/v1/intelligence/demand?geography_id=in&metric=active_vacancies", decodeDemand, controller.signal),
      api.get("/v1/intelligence/demand/coverage", decodeDemandCoverage, controller.signal),
      api.get("/v1/sources", decodeSources, controller.signal),
    ]).then(([demand, coverage, sources]) => {
      if (controller.signal.aborted) return;
      if (demand.version !== coverage.version) throw new Error("Mixed demand publications");
      if (demand.status === "UNAVAILABLE" || !demand.items.length) { setState({ status: "unavailable" }); return; }
      const observation = demand.items[0];
      const source = demand.sources.find(s => s.source_id === observation.source_id);
      // Multiple stocks/periods need an explicit selection; do not pick or combine them silently.
      if (demand.total !== 1 || demand.items.length !== 1 || observation.geography_id !== "in" || observation.geography_level !== "country" || !source || !validDate(observation.period_start) || !validDate(observation.publication_date)
        || coverage.options.reference_period.length !== 1 || coverage.options.reference_period[0] !== observation.reference_period
        || coverage.quality.valid_records + coverage.quality.warning_records !== coverage.quality.published_records
        || !coverage.sources.some(s => s.source_id === source.source_id && s.sha256 === source.sha256)) throw new Error("Incompatible snapshot coverage");
      const matchedRegions = new Set(coverage.options.geographies.filter(g => g.geography_level === "state" || g.geography_level === "ut").map(g => g.geography_id)).size;
      if (coverage.quality.published_records < matchedRegions + 1 || !coverage.options.geographies.some(g => g.geography_id === "in" && g.geography_level === "country")) throw new Error("Inconsistent geographic coverage");
      setState({ status: "ready", data: { observation, source, matchedRegions, observedRecords: coverage.quality.published_records, sources: [...sources.filter(s => s.connected), source] } });
    }).catch(() => { if (!controller.signal.aborted) setState({ status: "error" }); });
    return () => controller.abort();
  }, [attempt]);
  return { ...state, retry: () => { setState({ status: "loading" }); setAttempt(value => value + 1); } };
}
