import { useLocale } from "../../hooks/usePreferences";
import { SectionHeading } from "./SectionHeading";
const dimensions = ["glance.skills","glance.occupations","glance.industries","glance.regions","glance.demand"] as const;
export function AtAGlanceSection() {
  const { t } = useLocale();
  return <section className="public-section public-wrap glance-section">
    <div className="glance-copy"><SectionHeading eyebrow={t("glance.eyebrow")} title={t("glance.title")}><p>{t("glance.description")}</p></SectionHeading></div>
    <div className="glance-visual">
      <div className="glance-caption"><span>{t("glance.scope")}</span><span>{t("hero.visualDisclosure")}</span></div>
      <ol>{dimensions.map((key, index) => <li key={key}><span className="glance-index">0{index + 1}</span><span>{t(key)}</span><i aria-hidden="true" /></li>)}</ol>
      <p>{t("glance.disclosure")}</p>
    </div>
  </section>;
}
