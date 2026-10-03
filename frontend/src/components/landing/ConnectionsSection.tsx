import { useLocale } from "../../hooks/usePreferences";
import { SectionHeading } from "./SectionHeading";
import { RelationshipGraph } from "./RelationshipGraph";
export function ConnectionsSection() {
  const { t } = useLocale();
  return <section className="public-section public-wrap connections-section">
    <div><SectionHeading eyebrow={t("connections.eyebrow")} title={t("connections.title")}><p>{t("connections.description")}</p></SectionHeading></div>
    <RelationshipGraph />
  </section>;
}
