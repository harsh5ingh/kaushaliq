import { useLocale } from "../../hooks/usePreferences";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { getNavigation, getMissingPage } from "../../app/config/navigation";
import { Header } from "./Header";
import { CommandPalette } from "../navigation/CommandPalette";
import { WorkspaceDataBanner } from "../workspace/WorkspaceDataBanner";
import { DataProvider } from "../../features/real-intelligence/DataProvider";
import { useIntelligenceData } from "../../features/real-intelligence/dataContext";
const RealIntelligencePage = lazy(() => import("../../features/real-intelligence/RealIntelligencePage").then(module => ({ default: module.RealIntelligencePage })));

export function AppShell() {
  return <DataProvider><WorkspaceShell /></DataProvider>;
}
function WorkspaceShell() {
  const { t } = useLocale();
  const { mode } = useIntelligenceData();

const navigation = getNavigation(t);
const missingPage = getMissingPage(t);

  const location = useLocation();
  const [overlay, setOverlay] = useState<"search" | "navigation" | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousPath = useRef(location.pathname);
  const accountRoute = location.pathname === "/profile" ? "profile" : location.pathname === "/settings" ? "settings" : location.pathname === "/help" ? "help" : null;
  const existingPage = navigation.find((item) => item.path === location.pathname.replace(/\/$/, "") || (item.path === "/" && location.pathname === "/")) ?? (accountRoute ? { ...missingPage, label: t(`account.${accountRoute}` as "account.profile" | "account.settings" | "account.help"), title: t(`account.${accountRoute}` as "account.profile" | "account.settings" | "account.help"), description: t(`account.${accountRoute}Description` as "account.profileDescription" | "account.settingsDescription" | "account.helpDescription") } : missingPage);
  const routePath = location.pathname.replace(/\/$/, '') || '/';
  const isIntelligence = navigation.some(item => item.path === routePath);
  const personalRoute = location.pathname === "/my-intelligence" || location.pathname === "/onboarding";
  const page = personalRoute ? { ...missingPage, label:t("personal.title"), title:t(location.pathname === "/onboarding" ? "personal.onboard" : "personal.title"), description:t("personal.intro") } : mode === "real" && isIntelligence ? { ...existingPage, title:routePath === '/forecast' ? t('forecast.shellTitle') : existingPage.title, description: routePath === '/early-warning' || routePath === '/scenarios' ? existingPage.description : t("real.bannerDetail") } : existingPage;
  useEffect(() => {
    document.title = `${page.label} · KaushalIQ`;
    if (previousPath.current !== location.pathname) {
      heading.current?.focus();
      window.scrollTo({ top: 0 });
      previousPath.current = location.pathname;
    }
  }, [location.pathname, page.label]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (document.querySelector("dialog[open]:not(.command-palette)")) return;
        setOverlay((current) => current === "search" ? null : "search");
      }
    }
    const desktop = window.matchMedia("(min-width: 768px)");
    function onResize() { if (desktop.matches) setOverlay((current) => current === "navigation" ? null : current); }
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);
    return () => { window.removeEventListener("keydown", onKey); desktop.removeEventListener("change", onResize); };
  }, []);
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">{t("common.skip")}</a>
    <div className="workspace">
      <Header page={page} onSearch={() => setOverlay("search")} onMenu={() => setOverlay((current) => current === "navigation" ? null : "navigation")} menuOpen={overlay === "navigation"} />
      <main id="main-content" className="main-content" tabIndex={-1}>
        <div className="page-heading"><p className="eyebrow">{t("navigation.workspaceEyebrow")}</p>
          <h1 ref={heading} tabIndex={-1}>{page.title}</h1><p>{page.description}</p>
        </div>
        {isIntelligence && <WorkspaceDataBanner />}
        <div className="page-content" key={location.pathname}>{mode === "real" && isIntelligence ? <Suspense fallback={<p role="status">{t("real.loading")}</p>}><RealIntelligencePage /></Suspense> : <Outlet />}</div>
        <footer className="workspace-footer"><span>{t(mode === "real" ? "real.footer" : "navigation.workspaceFooter")}</span><span>{t(mode === "real" ? "real.phase" : "navigation.phase")}</span></footer>
      </main>
    </div>
    {overlay === "search" && <CommandPalette onClose={() => setOverlay(null)} />}
  </div>;
}
