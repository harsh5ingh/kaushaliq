import { useLocale } from "../../hooks/usePreferences";
import { SectionHeading } from "./SectionHeading";

export function ProcessSection() {
  const { t } = useLocale();
const steps = [
  [t("process.collect"), t("process.collectDescription")],
  [t("process.validate"), t("process.validateDescription")],
  [t("process.analyse"), t("process.analyseDescription")],
  [t("process.understand"), t("process.understandDescription")]
];

  return <section className="public-section public-wrap how-section">
    <div className="section-lead"><SectionHeading eyebrow={t("process.eyebrow")} title={t("process.title")} />
      <p className="preview-availability">{t("process.note")}</p></div>
    <ol className="process-steps">{steps.map(([title, description], i) => <li key={title}><span className="step-number">0{i + 1}</span><h3>{title}</h3><p>{description}</p></li>)}</ol>
  </section>;
}
