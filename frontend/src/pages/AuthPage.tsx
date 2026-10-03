import { Link, useLocation, useNavigate } from "react-router-dom";
import { Brand } from "../components/navigation/Brand";
import { ProductPreferences } from "../components/navigation/ProductPreferences";
import { AuthExperience } from "../components/auth/AuthExperience";
import type { AuthMode } from "../components/auth/authNavigation";
import { useLocale } from "../hooks/usePreferences";
import { useEffect } from "react";
import { oauthError } from '../features/account/oauth';

export function AuthPage() {
  const { t } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const mode = location.pathname.endsWith("signup") ? "signup" : location.pathname.endsWith("reset") ? "reset" : "login";
  useEffect(() => { document.title = `${mode === "signup" ? t("auth.signupHeading") : t("auth.welcome")} · KaushalIQ`; }, [mode, t]);
  function switchMode(next: AuthMode) { navigate(`/auth/${next === "login" ? "signin" : next}`, { replace: true, state: location.state }); }
  const expired = new URLSearchParams(location.search).get("reason") === "expired";
  const signedOutAll = new URLSearchParams(location.search).get('reason') === 'signed-out-all';
  const providerError = new URLSearchParams(location.search).get('oauth_error');
  return <div className="auth-screen">
    <a className="skip-link" href="#auth-content">{t("common.skip")}</a>
    <header className="auth-screen-header"><Brand /><div className="auth-screen-controls"><ProductPreferences /><Link to="/">{t("common.website")}</Link></div></header>
    <main id="auth-content" className="auth-screen-main">
      {expired && <p className="session-expired-note" role="status">{t("auth.sessionExpired")}</p>}
      {signedOutAll && <p className="session-expired-note" role="status">{t('security.everywhereSignedOut')}</p>}
      {providerError && <p className="session-expired-note" role="alert">{t(oauthError(providerError))}</p>}
      <AuthExperience mode={mode} onMode={switchMode} />
    </main>
  </div>;
}
