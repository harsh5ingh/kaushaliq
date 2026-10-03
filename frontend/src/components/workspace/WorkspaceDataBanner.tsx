import { Database } from "lucide-react";
import { useLocale } from "../../hooks/usePreferences";
import { useIntelligenceData } from "../../features/real-intelligence/dataContext";
export function WorkspaceDataBanner() {
  const { t } = useLocale();
  const { mode } = useIntelligenceData();
  return <aside className="workspace-data-banner" aria-label={t(mode === "real" ? "real.banner" : "workspace.dataStatus")}>
    <Database size={17} aria-hidden="true" /><strong>{t(mode === "real" ? "real.banner" : "workspace.dataStatus")}</strong><span>{t(mode === "real" ? "real.bannerDetail" : "workspace.dataStatusDetail")}</span>
  </aside>;
}
