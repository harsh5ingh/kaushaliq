import { useLocale } from "../../hooks/usePreferences";
import { getPublicTitles } from "../../app/config/publicNavigation";
import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { PublicNavbar } from "../navigation/PublicNavbar";
import { PublicFooter } from "../footer/PublicFooter";

export function PublicLayout() {
  const { t } = useLocale();

  const { pathname } = useLocation();
  const main = useRef<HTMLElement>(null);
  const previous = useRef(pathname);
  useEffect(() => {
    const label = getPublicTitles(t)[pathname] ?? t("common.platform");
    document.title = `KaushalIQ · ${label}`;
    if (previous.current !== pathname) {
      window.scrollTo({ top: 0 });
      main.current?.focus();
      previous.current = pathname;
    }
  }, [pathname, t]);
  return <div className="public-site">
    <a className="skip-link" href="#public-content">{t("common.skip")}</a>
    <PublicNavbar key={pathname} />
    <main ref={main} id="public-content" tabIndex={-1}><Outlet /></main>
    <PublicFooter />
  </div>;
}
