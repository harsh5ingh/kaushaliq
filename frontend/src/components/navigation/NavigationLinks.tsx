import { useLocale } from "../../hooks/usePreferences";
import { useId } from "react";
import { NavLink } from "react-router-dom";
import { getNavigation } from "../../app/config/navigation";
import { useIntelligenceData } from "../../features/real-intelligence/dataContext";

export function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useLocale();
  const { mode, catalog } = useIntelligenceData();

const navigation = getNavigation(t);

  const id = useId();
  return <nav aria-label={t("navigation.main")} className="navigation">
    {navigation.map(({ path, label, icon: Icon, availability }) => <NavLink
      key={path} to={path + (mode === "sample" ? "?data=sample" : "")} aria-describedby={id + path} end onClick={onNavigate} title={label}
      className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
      <Icon size={19} aria-hidden="true" /><span>{label}</span><small id={id + path} className="nav-planned" aria-hidden="true">{mode === "sample" ? availability === "sample" ? t("workspace.demoTag") : t("common.planned") : t(catalog?.coverage.find(c => c.dimension === (path === "/intelligence" ? "labour" : path.slice(1)))?.status === "OBSERVED" ? "real.connected" : "real.notConnected")}</small>
    </NavLink>)}
  </nav>;
}
