import { useEffect, useRef, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { ChevronDown, CircleHelp, Menu, Search, Settings, UserRound } from "lucide-react";
import { useLocale } from "../../hooks/usePreferences";
import { useAuth } from "../../app/providers/authContext";
import { ProductPreferences } from "../navigation/ProductPreferences";
import type { PageMetadata } from "../../types/intelligence";
import { IconButton } from "../ui/Buttons";
import { Modal } from "../ui/Modal";
import { NavigationLinks } from "../navigation/NavigationLinks";
import { WorkspaceUtilities } from "../navigation/WorkspaceUtilities";
import { Brand } from "../navigation/Brand";
import { getNavigation } from "../../app/config/navigation";
import { useIntelligenceData } from "../../features/real-intelligence/dataContext";

const primary = ["/intelligence", "/skills", "/regions", "/occupations", "/industries"];
const secondary = ["/demand", "/forecast", "/spatial", "/reports"];

export function AccountMenu() {
  const { t } = useLocale();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const initials = user?.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "K";
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!wrapper.current?.contains(event.target as Node)) setOpen(false); };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape" && open) { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", key); };
  }, [open]);
  async function logout() { setError(false); try { await signOut(); } catch { setError(true); } }
  if (!user) return <Link className="workspace-login" to="/auth/signin">{t("common.signIn")}</Link>;
  return <div className="account-menu" ref={wrapper}>
    <button ref={trigger} className="account-trigger" type="button" aria-label={t("account.openMenu")} aria-controls="account-popover" aria-expanded={open} onClick={() => setOpen((value) => !value)}><span className="account-avatar" aria-hidden="true">{initials}</span><ChevronDown size={14} aria-hidden="true" /></button>
    {open && <div id="account-popover" className="account-popover" role="region" aria-label={t("account.account")}>
      <div className="account-identity"><span className="account-avatar" aria-hidden="true">{initials}</span><span><strong>{user.name}</strong><small>{user.email}</small></span></div>
      <p className="account-kicker">{t("account.account")}</p>
      <Link to="/my-intelligence" onClick={()=>setOpen(false)}>{t('personal.title')}</Link>
      <Link to="/profile" onClick={() => setOpen(false)}><UserRound size={16} />{t("account.profile")}</Link>
      <Link to="/settings" onClick={() => setOpen(false)}><Settings size={16} />{t("account.settings")}</Link>
      <Link to="/help" onClick={() => setOpen(false)}><CircleHelp size={16} />{t("account.help")}</Link>
      {error && <p className="account-error" role="alert">{t("account.signOutError")}</p>}
      <button type="button" onClick={() => void logout()}>{t("account.signOut")}</button>
    </div>}
  </div>;
}

export function Header({ page, onSearch, onMenu, menuOpen }: { page: PageMetadata; onSearch: () => void; onMenu: () => void; menuOpen: boolean }) {
  const { t } = useLocale();
  const { mode } = useIntelligenceData();
  const { user } = useAuth();
  const moreRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const dismiss = (event: PointerEvent) => { if (!moreRef.current?.contains(event.target as Node)) moreRef.current?.removeAttribute("open"); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && moreRef.current?.open) { moreRef.current.open = false; moreRef.current.querySelector("summary")?.focus(); } };
    document.addEventListener("pointerdown", dismiss); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", escape); };
  }, []);
  useEffect(() => { moreRef.current?.removeAttribute("open"); }, [page.path]);
  return <header className="workspace-header">
    <div className="workspace-brand-area"><IconButton label={t("navigation.openWorkspace")} className="mobile-menu" onClick={onMenu} aria-expanded={menuOpen} aria-haspopup="dialog"><Menu size={20} /></IconButton><Brand /><span className="workspace-indicator">{t("account.workspace")}</span></div>
    <nav className="workspace-primary-nav" aria-label={t("account.workspaceNav")}>
      {getWorkspaceItems(t).filter((item) => primary.includes(item.path)).map((item) => <NavLink key={item.path} end to={item.path + (mode === "sample" ? "?data=sample" : "")} title={item.label} className={({ isActive }) => isActive ? "active" : ""}>{item.label}</NavLink>)}
      <details ref={moreRef} className={`workspace-more ${secondary.includes(page.path) ? "has-active" : ""}`}><summary>{t("account.more")}<ChevronDown size={14} /></summary><div className="workspace-more-menu">
        {user && <NavLink to="/my-intelligence" className={({isActive})=>isActive?'active':''}>{t('personal.title')}</NavLink>}
        {getWorkspaceItems(t).filter((item) => secondary.includes(item.path)).map((item) => <NavLink key={item.path} end to={item.path + (mode === "sample" ? "?data=sample" : "")} className={({ isActive }) => isActive ? "active" : ""}>{item.label}</NavLink>)}
      </div></details>
    </nav>
    <div className="workspace-header-actions">
      <button className="search-trigger" onClick={onSearch} aria-label={t("search.title")} aria-haspopup="dialog" aria-keyshortcuts="Control+k Meta+k"><Search size={16} aria-hidden="true" /><span>{t("search.workspace")}</span><kbd>Ctrl K</kbd></button>
      <div className="workspace-preferences"><ProductPreferences /></div>
      <AccountMenu />
    </div>
    {menuOpen && <Modal title={t("account.workspaceNav")} id="workspace-navigation-heading" className="mobile-drawer" onClose={onMenu}>
      <NavigationLinks onNavigate={onMenu} /><WorkspaceUtilities onNavigate={onMenu} />
      <div className="mobile-preferences"><ProductPreferences /></div><p className="drawer-note">{t(mode === "real" ? "real.bannerDetail" : "navigation.sampleNote")}</p>
    </Modal>}
    <span className="sr-only" aria-live="polite">{page.label}{user ? ` · ${user.name}` : ""}</span>
  </header>;
}

function getWorkspaceItems(t: ReturnType<typeof useLocale>["t"]) { return getNavigation(t); }
