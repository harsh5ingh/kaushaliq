import { useLocation, useNavigate } from "react-router-dom";
import SimpleBar from "simplebar-react";
import { Modal } from "../ui/Modal";
import { authSearch, getAuthMode, type AuthMode } from "./authNavigation";
import { AuthExperience } from "./AuthExperience";
import { useLocale } from "../../hooks/usePreferences";

export function AuthDialog() {
  const { t } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const mode = getAuthMode(new URLSearchParams(location.search).get("auth"));
  if (!mode || location.pathname.startsWith("/auth/")) return null;
  const headings: Record<AuthMode, string> = { login: t("auth.welcome"), signup: t("auth.signupHeading"), reset: t("auth.resetHeading") };
  function close() {
    const state: unknown = location.state;
    if (typeof state === "object" && state !== null && "authOverlay" in state && state.authOverlay === true) navigate(-1);
    else navigate({ pathname: location.pathname, search: authSearch(location.search, null), hash: location.hash }, { replace: true });
  }
  function switchMode(next: AuthMode) { navigate({ pathname: location.pathname, search: authSearch(location.search, next), hash: location.hash }, { replace: true, state: location.state }); }
  return <Modal title={headings[mode]} id="auth-heading" className="auth-modal" onClose={close}>
    <SimpleBar className="auth-scroll" autoHide aria-label={t("auth.formScroll")}>
      <AuthExperience mode={mode} onMode={switchMode} />
    </SimpleBar>
  </Modal>;
}
