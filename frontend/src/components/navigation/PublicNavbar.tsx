import { useLocale } from "../../hooks/usePreferences";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, ArrowUpRight } from "lucide-react";
import { ProductPreferences } from "./ProductPreferences";
import { Brand } from "./Brand";
import { getPublicNavigation } from "../../app/config/publicNavigation";
import { AuthLink } from "../auth/AuthLink";
import { Modal } from "../ui/Modal";
import { IconButton } from "../ui/Buttons";
import { useAuth } from "../../app/providers/authContext";
import { AccountMenu } from "../layout/Header";

export function PublicNavbar() {
  const { t } = useLocale();
  const { user } = useAuth();

const publicNavigation = getPublicNavigation(t);

  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 24);
    const media = matchMedia("(min-width: 960px)");
    const resize = () => { if (media.matches) setMenu(false); };
    scroll();
    window.addEventListener("scroll", scroll, { passive: true });
    media.addEventListener("change", resize);
    return () => { window.removeEventListener("scroll", scroll); media.removeEventListener("change", resize); };
  }, []);
  const links = publicNavigation.map((item) => <NavLink onClick={() => setMenu(false)} key={item.path} to={item.path} className={({ isActive }) => isActive ? "active" : ""}>{item.label}</NavLink>);
  return <header className={`public-navbar ${scrolled ? "is-scrolled" : ""}`}>
    <div className="public-nav-inner"><Brand /><nav className="public-desktop-links" aria-label={t("navigation.product")}>{links}</nav>
      <div className="public-nav-actions"><div className="desktop-preferences"><ProductPreferences /></div>{user ? <><NavLink to="/intelligence" className="public-workspace-link">{t("account.workspace")}</NavLink><AccountMenu /></> : <><AuthLink mode="login" className="public-signin">{t("common.signIn")}</AuthLink>
        <AuthLink mode="signup" className="button button-primary public-start">{t("common.getStarted")}<ArrowUpRight size={15} aria-hidden="true" /></AuthLink></>}
        <IconButton label={t("navigation.openProduct")} className="public-menu-trigger" aria-expanded={menu} aria-haspopup="dialog" onClick={() => setMenu(true)}><Menu size={22} /></IconButton>
      </div>
    </div>
    {menu && <Modal title={t("navigation.explore")} id="product-navigation-heading" className="public-mobile-menu" onClose={() => setMenu(false)}>
      <nav aria-label={t("navigation.mobile")}>{links}</nav>
      <div className="mobile-preferences"><ProductPreferences /></div>
      <div className="mobile-auth-links">{user ? <NavLink to="/intelligence" className="button button-primary" onClick={() => setMenu(false)}>{t("account.workspace")}</NavLink> : <><AuthLink mode="login" className="button button-secondary" onClick={() => setMenu(false)}>{t("common.signIn")}</AuthLink>
        <AuthLink mode="signup" className="button button-primary" onClick={() => setMenu(false)}>{t("common.getStarted")}</AuthLink></>}</div>
      <p className="field-hint">{t("navigation.preview")}</p>
    </Modal>}
  </header>;
}
