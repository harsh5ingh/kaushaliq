import { useLocale } from "../../hooks/usePreferences";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { RegionalDiagram } from "./RegionalDiagram";
export function RegionalSection() {
  const { t } = useLocale();
  return <section className="regional-band"><div className="public-section public-wrap regional-section">
    <div className="regional-copy"><SectionHeading eyebrow={t("regional.eyebrow")} title={t("regional.title")}><p>{t("regional.description")}</p><Link className="text-link" to="/regions">{t("regional.action")}<ArrowRight size={16} aria-hidden="true" /></Link></SectionHeading></div>
    <RegionalDiagram />
  </div></section>;
}
