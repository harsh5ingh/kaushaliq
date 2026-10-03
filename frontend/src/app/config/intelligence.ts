import type { Translator } from "../i18n/config";
import type { IntelligenceKind } from "../../types/intelligence";

export function getIntelligenceKinds(t: Translator): Record<IntelligenceKind, { label: string; description: string }> { return {
  observed: { label: t("common.observed"), description: t("status.observedDescription") },
  derived: { label: t("common.derived"), description: t("status.derivedDescription") },
  forecast: { label: t("common.forecast"), description: t("status.forecastDescription") },
  scenario: { label: t("common.scenario"), description: t("status.scenarioDescription") },
  sample: { label: t("common.sample"), description: t("status.sampleDescription") },
}; }
