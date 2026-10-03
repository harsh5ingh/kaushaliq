import { Link } from "react-router-dom";
import { useLocale } from "../../hooks/usePreferences";
import { StatusBadge } from "../ui/StatusBadge";

export function UnavailableIntelligence({ title, description }: { title: string; description: string }) {
  const { t } = useLocale();
  return <section className="viz-unavailable"><StatusBadge kind="unavailable" /><h2>{title}</h2><p>{description}</p>
    <div className="viz-available"><h3>{t("viz.availableEvidence")}</h3><ul><li>MoSPI — PLFS · {t("real.overview")}</li><li>MSDE — PMKVY · {t("real.training")}</li></ul></div>
    <Link className="button button-secondary" to="/intelligence">{t("viz.availableAction")}</Link>
  </section>;
}
