import { Link } from "react-router-dom";
import { useLocale } from "../../hooks/usePreferences";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useIntelligenceData } from "./dataContext";
import { RelationshipGraph } from "../../components/visualization/RelationshipGraph";

export function SpatialCoverage() {
  const { t } = useLocale(); const { catalog } = useIntelligenceData();
  return <section className="viz-spatial-coverage"><StatusBadge kind="unavailable" /><h2>{t("viz.spatialTitle")}</h2><p>{t("viz.spatialIntro")}</p>
    <div className="viz-coverage-columns"><div><h3>{t("viz.spatialAvailable")}</h3><dl><dt>{t("viz.spatialReferences")}</dt><dd>{catalog?.regions.length}</dd><dt>{t("viz.spatialObservations")}</dt><dd>{t("real.observed")} · MoSPI — PLFS</dd></dl></div>
      <div><h3>{t("viz.spatialRequired")}</h3><ol><li>{t("viz.boundaries")}</li><li>{t("viz.join")}</li><li>{t("viz.district")}</li></ol></div></div>
    <Link className="button button-secondary" to="/regions">{t("viz.regionalAction")}</Link>
    <RelationshipGraph data={null} />
  </section>;
}
