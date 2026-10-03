import type { Translator } from "../../app/i18n/config";
import { Database, BrainCircuit, MapPinned, CalendarDays } from "lucide-react";
import type { Metric } from "../../types/intelligence";

// Display fixtures only. These values are not backed by a dataset or analytics.
export function getSampleMetrics(t: Translator): readonly Metric[] { return [
  { id: "signals", label: t("metric.signals"), value: "24,680", note: t("metric.signalsNote"), kind: "sample", icon: Database },
  { id: "skills", label: t("metric.skills"), value: "8,420", note: t("metric.skillsNote"), kind: "sample", icon: BrainCircuit },
  { id: "gaps", label: t("metric.gaps"), value: "1,284", note: t("metric.gapsNote"), kind: "sample", icon: MapPinned },
  { id: "snapshot", label: t("metric.year"), value: "2026", note: t("metric.yearNote"), kind: "sample", icon: CalendarDays },
]; }
