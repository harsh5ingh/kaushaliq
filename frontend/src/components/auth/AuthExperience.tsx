import { useLocale } from "../../hooks/usePreferences";
import type { AuthMode } from "./authNavigation";
import { AuthForm } from "./AuthForm";

export function AuthVisual() {
  const { t } = useLocale();
  return <aside className="auth-side">
    <span className="eyebrow">{t("auth.sideEyebrow")}</span><h3>{t("auth.sideCopy")}</h3>
    <svg viewBox="0 0 360 180" aria-hidden="true"><path d="M28 120 104 72 174 120 244 58 330 102 M104 72 150 28 244 58 M174 120 218 158 330 102" />{[[28,120],[104,72],[174,120],[244,58],[330,102],[150,28],[218,158]].map(([x,y])=><circle key={`${x}:${y}`} cx={x} cy={y} r="5" />)}</svg>
    <div className="auth-side-note">{t("auth.sideNote")}</div>
  </aside>;
}

export function AuthExperience({ mode, onMode }: { mode: AuthMode; onMode: (mode: AuthMode) => void }) {
  const { t } = useLocale();
  const headings: Record<AuthMode, string> = { login: t("auth.welcome"), signup: t("auth.signupHeading"), reset: t("auth.resetHeading") };
  return <div className="auth-layout">
    <AuthVisual />
    <div className="auth-form-panel">
      <h1 className="auth-page-heading">{headings[mode]}</h1>
      <div className="auth-intro"><span className="eyebrow">{t("auth.accountLabel")}</span><p>{mode === "reset" ? t("auth.resetIntro") : t("auth.intro")}</p></div>
      <AuthForm key={mode} mode={mode} onMode={onMode} />
    </div>
  </div>;
}
