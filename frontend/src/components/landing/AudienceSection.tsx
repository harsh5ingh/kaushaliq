import { useLocale } from "../../hooks/usePreferences";
import { SectionHeading } from "./SectionHeading";
const audiences = ["audience.gov","audience.education","audience.training","audience.industry","audience.research","audience.planning"] as const;
export function AudienceSection() {
  const { t } = useLocale();
  return <section className="public-section public-wrap audience-section">
    <SectionHeading eyebrow={t("audience.eyebrow")} title={t("audience.title")}><p>{t("audience.description")}</p></SectionHeading>
    <div className="audience-editorial"><h3>{t("audience.focus")}</h3><ol>{audiences.map((key,i)=><li key={key}><span className="editorial-number">0{i+1}</span><span>{t(key)}</span><span className="audience-mark" aria-hidden="true" /></li>)}</ol></div>
  </section>;
}
