import { GapIntelligence } from '../skill-gap/GapIntelligence';
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLocale } from "../../hooks/usePreferences";
import { ErrorState, LoadingState } from "../../components/ui/States";
import { UnavailableIntelligence } from "../../components/visualization/UnavailableIntelligence";
import { RelationshipGraph } from "../../components/visualization/RelationshipGraph";
import { RegionalComparison } from "./RegionalComparison";
import { SpatialCoverage } from "./SpatialCoverage";
import { useIntelligenceData } from "./dataContext";
import { ObservedLabour } from "./ObservedLabour";
import { ObservedTraining } from "./ObservedTraining";
import { IndustryReference } from "./IndustryReference";
import { DemandIntelligence } from "../demand/DemandIntelligence";
import { SupplyIntelligence } from "../supply/SupplyIntelligence";

export function RealIntelligencePage() {
  const { t } = useLocale(); const { pathname } = useLocation(); const { catalog, error, retry } = useIntelligenceData(); const [view, setView] = useState<"labour" | "training">("labour");
  if (error) return <ErrorState description={t("real.error")} onRetry={retry} />;
  if (!catalog) return <LoadingState label={t("real.loading")} />;
  if (pathname === "/spatial") return <SpatialCoverage />;
  if (pathname === "/industries") return <IndustryReference />;
  if (pathname === "/demand") return <DemandIntelligence />;
  if (pathname === "/skill-gaps") return <GapIntelligence />;
  if (pathname === "/supply") return <SupplyIntelligence />;
  if (pathname === "/reports") return <section><div className="real-section-heading"><h2>{t("real.coverage")}</h2><p>{t("real.quality")}</p></div>
    <div className="real-table-wrap"><table><caption>{t("real.coverage")}</caption><thead><tr><th>{t("real.name")}</th><th>{t("real.records")}</th><th>{t("real.source")}</th></tr></thead><tbody>{catalog.coverage.map(c => <tr key={c.dimension}><th scope="row">{t(c.dimension === "labour" ? "real.overview" : c.dimension === "training" ? "real.training" : c.dimension === "gaps" ? "real.noGap" : c.dimension === "spatial" ? "workspace.spatialTitle" : `common.${c.dimension}` as "common.skills")}</th><td>{c.dimension === "demand" ? "—" : catalog.quality.records[c.dimension] ?? "—"}</td><td>{c.dimension === "demand" ? <Link to="/demand">{t("demand.coverageAction")}</Link> : <>{c.source_ids.join(" · ") || "—"}<small>{t(c.status === "OBSERVED" ? "real.connected" : "real.notConnected")}</small></>}</td></tr>)}</tbody></table></div><p className="real-note">{t("real.quarantine")}</p><p className="real-note">{t("real.noGap")}</p></section>;
  const unavailable = pathname === "/skills" ? ["real.skills", "real.skillNote"] : pathname === "/occupations" ? ["real.occupations", "real.occupationNote"] : null;
  if (unavailable) return <><UnavailableIntelligence title={t(unavailable[0] as "real.skills")} description={t(unavailable[1] as "real.skillNote")} />{(pathname === "/skills" || pathname === "/occupations") && <RelationshipGraph data={null} />}</>;
  return <div className="real-intelligence">
    {pathname === "/forecast" ? <div className="real-section-heading"><h2>{t("real.forecast")}</h2><p>{t("real.forecastNote")}</p></div> : <div className="real-view-switch" role="group" aria-label={t("real.view")}><button type="button" aria-pressed={view === "labour"} onClick={() => setView("labour")}>{t("real.overview")}</button><button type="button" aria-pressed={view === "training"} onClick={() => setView("training")}>{t("real.training")}</button></div>}
    {view === "training" && pathname !== "/forecast" ? <ObservedTraining /> : <ObservedLabour showHistory={pathname !== "/regions"} />}
    {pathname === "/regions" && view === "labour" && <RegionalComparison />}
  </div>;
}
