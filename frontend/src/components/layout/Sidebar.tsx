import { useLocale } from "../../hooks/usePreferences";
import { WorkspaceUtilities } from "../navigation/WorkspaceUtilities";
import { Brand } from "../navigation/Brand";
import { Database } from "lucide-react";
import { NavigationLinks } from "../navigation/NavigationLinks";

export function Sidebar() {
  const { t } = useLocale();

  return <aside className="sidebar">
    <Brand /><p className="eyebrow nav-caption">{t("navigation.workspace")}</p><NavigationLinks />
    <div className="sidebar-footer"><Database size={18} aria-hidden="true" />
      <div><strong>{t("navigation.evidence")}</strong><p>{t("navigation.evidenceDescription")}</p></div>
    </div>
    <WorkspaceUtilities compact />
    <span className="sidebar-version">{t("navigation.brandNote")}</span>
  </aside>;
}
