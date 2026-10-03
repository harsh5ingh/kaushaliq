import { useLocale } from "../../hooks/usePreferences";
import { SectionHeading } from "./SectionHeading";
import { StatusBadge } from "../ui/StatusBadge";

export function EvidenceSection() {
  const { t } = useLocale();
const language = [
  { status: "observed", description: t("evidence.observed") },
  { status: "derived", description: t("evidence.derived") },
  { status: "forecast", description: t("evidence.forecast") },
  { status: "scenario", description: t("evidence.scenario") }
] as const;

  return <section id="evidence" className="public-section public-wrap evidence-section">
    <div className="evidence-statement"><SectionHeading eyebrow={t("evidence.eyebrow")} title={t("evidence.title")}>
      <p>{t("evidence.description")}</p>
    </SectionHeading><p className="evidence-caveat">{t("evidence.note")}</p></div>
    <div className="evidence-specimen"><div className="specimen-title"><span>{t("evidence.standard")}</span><span>{t("evidence.contract")}</span></div>
      <dl className="provenance-list">{[
        [t("evidence.source"), t("evidence.sourceDescription")], [t("evidence.period"), t("evidence.periodDescription")],
        [t("evidence.geography"), t("evidence.geographyDescription")], [t("evidence.method"), t("evidence.methodDescription")],
        [t("evidence.type"), t("evidence.typeDescription")], [t("evidence.uncertainty"), t("evidence.uncertaintyDescription")]
      ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    </div>
    <div className="evidence-language">{language.map(item => <div key={item.status}><StatusBadge kind={item.status} /><p>{item.description}</p></div>)}</div>
  </section>;
}
