import type { MessageKey } from "../../app/i18n/config";
import { useLocale } from "../../hooks/usePreferences";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook, FaGithub } from "react-icons/fa6";
import { AuthField } from "./AuthField";
import type { AuthMode } from "./authNavigation";
import { PrimaryButton, SecondaryButton } from "../ui/Buttons";
import { useAuth } from "../../app/providers/authContext";
import { PasswordStrength } from './PasswordStrength';
import { validPassword } from '../../features/account/passwordPolicy';
import { useLocation } from 'react-router-dom';
import { accountRequest, AccountError } from '../../features/account/api';
import type { OAuthAvailability, OAuthProvider } from '../../features/account/oauth';
import { Loader } from '../ui/Loader';

type FieldName = "name" | "email" | "password" | "confirm";
type FieldErrors = Partial<Record<FieldName, MessageKey>>;
type FormStatus = "idle" | "pending";
const firstField: Record<AuthMode, FieldName> = { login: "email", signup: "name", reset: "email" };

export function AuthForm({ mode, onMode }: { mode: AuthMode; onMode: (mode: AuthMode) => void }) {
  const { t } = useLocale();
  const auth = useAuth();
  const { clearError } = auth;
  const form = useRef<HTMLFormElement>(null);
  const resetPanel = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const location = useLocation();
  const [providers, setProviders] = useState<OAuthAvailability | null>(null);
  const [provider, setProvider] = useState<OAuthProvider | null>(null);
  const [providerError, setProviderError] = useState<MessageKey | null>(null);
  const providerInFlight = useRef(false);
  useEffect(() => { let active=true; accountRequest<OAuthAvailability>('/auth/providers','').then(result=>{if(active)setProviders(result);}).catch(()=>{if(active)setProviderError('oauth.failed');}); return()=>{active=false;}; }, []);
  useEffect(() => { if (mode === "reset") resetPanel.current?.querySelector<HTMLButtonElement>("button")?.focus(); else form.current?.querySelector<HTMLInputElement>(`[name="${firstField[mode]}"]`)?.focus(); clearError(); }, [mode, clearError]);

  async function openProvider(next: OAuthProvider) {
    if (providerInFlight.current || status==='pending') return;
    providerInFlight.current=true;setProvider(next);setProviderError(null);
    try {
      const state=location.state as {returnTo?:unknown}|null;
      const returnTo=typeof state?.returnTo==='string'?state.returnTo:'/intelligence';
      const challenge=auth.csrf || (await accountRequest<{csrfToken:string}>('/auth/csrf','')).csrfToken;
      const result=await accountRequest<{authorizationUrl:string}>('/auth/oauth/'+next+'/start',challenge,'POST',{return_to:returnTo});
      window.location.assign(result.authorizationUrl);
    } catch (error) {setProviderError(error instanceof AccountError?error.key:'oauth.failed');setProvider(null);providerInFlight.current=false;}
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "pending" || providerInFlight.current || mode === "reset") return;
    auth.clearError();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const name = String(data.get("name") ?? "").trim();
    const next: FieldErrors = {};
    if (mode === "signup" && !name) next.name = "auth.nameRequired";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "auth.emailInvalid";
    if (!password) next.password = "auth.passwordRequired";
    if (mode === "signup" && !validPassword(password)) next.password = "personal.passwordPolicy";
    if (mode === "signup" && password !== confirm) next.confirm = "auth.passwordMismatch";
    setErrors(next);
    if (Object.keys(next).length) { form.current?.querySelector<HTMLInputElement>(`[name="${Object.keys(next)[0]}"]`)?.focus(); return; }
    setStatus("pending");
    try { if (mode === "signup") await auth.signUp(name, email, password); else await auth.signIn(email, password); }
    catch { /* The provider exposes a localized, user-safe error message. */ }
    finally { setStatus("idle"); }
  }

  if (mode === "reset") return <div ref={resetPanel} className="auth-unavailable"><p>{t("auth.resetUnavailable")}</p><SecondaryButton type="button" onClick={() => onMode("login")}>{t("auth.backToLogin")}</SecondaryButton></div>;
  const normalizedError = auth.error?.toLowerCase() ?? "";
  const authError = normalizedError.includes("incorrect") ? t("auth.loginError") : normalizedError.includes("already exist") ? t("auth.registerError") : normalizedError.includes("too many attempts") ? t("auth.rateLimit") : normalizedError.includes("at least 8 characters") || normalizedError.includes("too long") ? t("auth.passwordLength") : auth.error ? t("auth.serviceError") : null;
  return <>
    <div className="social-auth" aria-describedby="oauth-availability">
      <SecondaryButton type="button" disabled={!providers?.oauth.google || auth.loading || status==='pending' || provider!==null} aria-busy={provider==='google'} onClick={() => void openProvider('google')}><FcGoogle size={18} aria-hidden="true" />{t("auth.google")}</SecondaryButton>
      <SecondaryButton type="button" disabled={!providers?.oauth.github || auth.loading || status==='pending' || provider!==null} aria-busy={provider==='github'} onClick={() => void openProvider('github')}><FaGithub size={17} aria-hidden="true" />{t("auth.github")}</SecondaryButton>
      <SecondaryButton type="button" disabled><FaFacebook size={17} aria-hidden="true" />{t("auth.facebook")}</SecondaryButton>
    </div>
    <p id="oauth-availability" className="provider-availability">{t(providers?.oauth.google || providers?.oauth.github?'oauth.available':'auth.providerStatus')}</p>
    {provider&&<p className="progress-label" role="status"><Loader/>{t('oauth.pending')}</p>}
    {providerError&&<p className="field-error" role="alert">{t(providerError)}</p>}
    <div className="auth-divider"><span>{t("auth.emailAlternative")}</span></div>
    <form ref={form} noValidate onSubmit={submit} aria-label={mode === "signup" ? t("auth.createPreview") : t("auth.signinPreview")} onInput={() => { setErrors({}); auth.clearError(); }}>
      {mode === "signup" && <AuthField name="name" label={t("auth.name")} autoComplete="name" required error={errors.name ? t(errors.name) : undefined} />}
      <AuthField name="email" label={t("auth.email")} type="email" autoComplete="email" inputMode="email" required error={errors.email ? t(errors.email) : undefined} />
      <AuthField name="password" label={t("auth.password")} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.currentTarget.value)} required error={errors.password ? t(errors.password) : undefined} hint={mode === "signup" ? t("auth.passwordHint") : undefined} />
      {mode === 'signup' && <PasswordStrength password={password} />}
      {mode === "signup" && <AuthField name="confirm" label={t("auth.confirm")} type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.currentTarget.value)} required error={errors.confirm ? t(errors.confirm) : confirm && password !== confirm ? t("auth.passwordMismatch") : undefined} />}
      {mode === "login" && <button type="button" className="auth-text-button forgot-password" onClick={() => onMode("reset")}>{t("auth.forgot")}</button>}
      {authError && <p className="field-error auth-server-error" role="alert">{authError}</p>}
      {Object.keys(errors).length > 0 && <p className="field-error" role="alert">{t("auth.review")}</p>}
      <PrimaryButton type="submit" className="auth-submit" disabled={status === "pending" || provider!==null} aria-busy={status === "pending"}>
        {status === "pending" ? t("auth.checking") : mode === "signup" ? t("auth.create") : t("common.signIn")}<ArrowRight size={16} aria-hidden="true" />
      </PrimaryButton>
      {status === "pending" && <p role="status" className="field-hint">{t("auth.validating")}</p>}
    </form>
    {!(providers?.oauth.google || providers?.oauth.github) && <div className="auth-preview-note"><p>{t('auth.disclaimer')}</p></div>}
    <p className="auth-switch">{mode === "signup" ? t("auth.already") : t("auth.new")} {" "}
      <button type="button" className="auth-text-button" onClick={() => onMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? t("auth.createAccount") : t("common.signIn")}</button>
    </p>
  </>;
}
