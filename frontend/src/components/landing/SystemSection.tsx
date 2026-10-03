import { useLocale } from "../../hooks/usePreferences";
import { SectionHeading } from "./SectionHeading";
const dimensions = ["common.skills","common.occupations","common.industries","common.regions","system.demand","system.supply","system.gaps","system.decisions"] as const;
export function SystemSection() {
  const { t } = useLocale();
  return <section className="public-section public-wrap system-section">
    <div className="system-intro"><SectionHeading eyebrow={t("system.eyebrow")} title={t("system.heading")}><p>{t("system.description")}</p><p className="section-footnote">{t("system.note")}</p></SectionHeading></div>
    <ol className="system-sequence" aria-label={t("system.heading")}>{dimensions.map((key,i)=><li key={key}><span className="editorial-number">0{i+1}</span><span>{t(key)}</span><i aria-hidden="true" /></li>)}</ol>
  </section>;
}
