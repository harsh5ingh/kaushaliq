import { useLocale } from "../hooks/usePreferences";
import { Link } from "react-router-dom";
import { ArrowLeft, Database, FileCheck2, CalendarDays } from "lucide-react";
import type { PageMetadata } from "../types/intelligence";
import { Panel } from "../components/ui/Panel";
import { EmptyState } from "../components/ui/States";

export function CapabilityPage({ page }: { page: PageMetadata }) {
  const { t } = useLocale();

  return <Panel className="capability-page"><span className="availability-label">{t("capability.planned")}</span>
    <EmptyState icon={page.icon} title={page.path === "/forecast" ? t("capability.forecastTitle") : t("capability.empty")}
      description={page.path === "/forecast"
        ? t("capability.forecastDescription")
        : t("capability.description")}
      action={<Link to="/intelligence" className="button button-secondary"><ArrowLeft size={16} aria-hidden="true" />{t("capability.back")}</Link>} />
    <div className="capability-requirements"><span><Database size={17} aria-hidden="true" />{t("capability.sources")}</span>
      <span><FileCheck2 size={17} aria-hidden="true" />{t("capability.observations")}</span><span><CalendarDays size={17} aria-hidden="true" />{t("capability.coverage")}</span></div>
    <p className="capability-note">{t("capability.note")}</p>
  </Panel>;
}
export function NotFoundPage() {
  const { t } = useLocale();

  return <Panel><EmptyState title={t("capability.missing")} description={t("capability.missingDescription")}
    action={<Link className="button button-primary" to="/intelligence">{t("capability.return")}</Link>} /></Panel>;
}
