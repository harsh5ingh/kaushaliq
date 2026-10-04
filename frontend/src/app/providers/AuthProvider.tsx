import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { AuthContext, useAuth, type Account } from "./authContext";
import type { Verification } from '../../features/account/contracts';
import { useLocale } from '../../hooks/usePreferences';
import { accountRequest } from '../../features/account/api';
import { LoadingState } from '../../components/ui/States';
const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") || "/api";
interface AuthResponse { user: Account; expiresAt: string; csrfToken: string }

async function request<T>(path: string, method = "GET", body?: unknown, csrf?: string): Promise<T> {
  const response = await fetch(`${baseUrl}/auth${path}`, {
    method, credentials: "include", headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}), ...(csrf ? { "X-CSRF-Token": csrf } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof payload === "object" && payload !== null && "detail" in payload && typeof payload.detail === "string" ? payload.detail : "Request failed";
    throw new Error(`${response.status}:${detail}`);
  }
  return payload as T;
}

function bootstrapAuth() {
  return Promise.all([request<{csrfToken:string}>('/csrf'), request<{authenticated:boolean;expired?:boolean;user?:Account;expiresAt?:string}>('/session')]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Account | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [signOutReason, setSignOutReason] = useState<'everywhere' | 'public' | null>(null);
  const [loading, setLoading] = useState(true);
  const [csrf, setCsrf] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending,setPending]=useState<Verification|null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const clearError = useCallback(() => setError(null), []);
  const bootstrap = useRef<ReturnType<typeof bootstrapAuth> | null>(null);
  useEffect(() => {
    let active = true;
    // StrictMode replays effects; share the initial cookie rotation rather than race two CSRF requests.
    (bootstrap.current ??= bootstrapAuth())
      .then(([challenge, session]) => { if (active) { setCsrf(challenge.csrfToken); setUser(session.authenticated ? session.user ?? null : null); setExpiresAt(session.authenticated ? session.expiresAt ?? null : null); setExpired(session.expired === true); } })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const invalid = () => { setUser(null); setExpiresAt(null); setCsrf(''); setExpired(true); };
    window.addEventListener('kaushaliq:session-invalid', invalid);
    return () => window.removeEventListener('kaushaliq:session-invalid', invalid);
  }, []);
  const authenticate = useCallback(async (path: string, body: Record<string, string>) => {
    setError(null);
    try {
      const challenge = csrf || (await request<{ csrfToken: string }>("/csrf")).csrfToken;
      const response = await request<AuthResponse|Verification>(path, "POST", body, challenge);
      if ('verification_required' in response) {
        setPending(response); setCsrf(response.csrfToken || challenge);
        navigate('/auth/verify',{state:location.state}); return;
      }
      setCsrf(response.csrfToken); setUser(response.user); setExpiresAt(response.expiresAt); setExpired(false); setSignOutReason(null);
      const state = location.state as { returnTo?: unknown } | null;
      const returnTo = typeof state?.returnTo === "string" && state.returnTo.startsWith("/") && !state.returnTo.startsWith("//") && !state.returnTo.startsWith("/auth/") ? state.returnTo : "/intelligence";
      navigate(returnTo, { replace: true });
    } catch (cause) { const message = cause instanceof Error ? cause.message : ""; setError(message.includes(":") ? message.slice(message.indexOf(":") + 1) : "The service could not be reached. Try again."); throw cause; }
  }, [csrf, location.state, navigate]);
  const signIn = useCallback((email: string, password: string) => authenticate("/login", { email, password }), [authenticate]);
  const refreshUser=useCallback(async()=>{ const response=await request<{user:Account}>('/me'); setUser(response.user); },[]);
  const verifyEmail=useCallback(async(code:string)=>{
    const response=await accountRequest<AuthResponse>('/auth/verification/confirm',csrf,'POST',{code});
    setUser(response.user);setExpiresAt(response.expiresAt);setCsrf(response.csrfToken);setExpired(false);setPending(null);setSignOutReason(null);
    const state=location.state as {returnTo?:unknown}|null;
    const destination=typeof state?.returnTo==='string' && state.returnTo.startsWith('/') && !state.returnTo.startsWith('//') && !state.returnTo.startsWith('/auth/') ? state.returnTo : '/onboarding';
    navigate(destination,{replace:true});
  },[csrf,location.state,navigate]);
  const signUp = useCallback((name: string, email: string, password: string) => authenticate("/register", { name, email, password }), [authenticate]);
  const signOut = useCallback(async () => {
    setError(null);
    try { const challenge = csrf || (await request<{ csrfToken: string }>("/csrf")).csrfToken; await request<{ signedOut: boolean }>("/logout", "POST", undefined, challenge); setSignOutReason('public'); setUser(null); setExpiresAt(null); setCsrf(""); setExpired(false); navigate("/", { replace: true }); }
    catch (cause) { setError(cause instanceof Error ? cause.message.slice(cause.message.indexOf(":") + 1) : "Sign out failed. Try again."); throw cause; }
  }, [csrf, navigate]);
  useEffect(() => {
    if (!user || !expiresAt) return;
    const remaining = new Date(expiresAt).getTime() - Date.now();
    const timer = window.setTimeout(() => {
      setUser(null); setExpiresAt(null); setCsrf(""); setExpired(true);
      if (["/profile", "/settings", "/help", "/my-intelligence", "/onboarding"].includes(location.pathname)) {
        navigate("/auth/signin?reason=expired", { replace: true, state: { returnTo: `${location.pathname}${location.search}${location.hash}` } });
      }
    }, Math.max(0, remaining));
    return () => window.clearTimeout(timer);
  }, [user, expiresAt, location.pathname, location.search, location.hash, navigate]);
  const signOutEverywhere = useCallback(async () => {
    await accountRequest('/v1/me/sessions/revoke-all', csrf, 'POST');
    setSignOutReason('everywhere');
    setUser(null); setExpiresAt(null); setCsrf(''); setPending(null); setExpired(false); setError(null);
    navigate('/auth/signin?reason=signed-out-all', { replace: true });
  }, [csrf, navigate]);
  const value = useMemo(() => ({ user, loading, expired, signOutReason, csrf, error, pending, verifyEmail, refreshUser, clearError, signIn, signUp, signOut, signOutEverywhere }), [user, loading, expired, signOutReason, csrf, error, pending, verifyEmail, refreshUser, clearError, signIn, signUp, signOut, signOutEverywhere]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { t }=useLocale();
  const { user, loading, expired, signOutReason } = useAuth();
  const hadUser = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => { if (user) { hadUser.current=true; return; } if (!loading) navigate(hadUser.current && signOutReason==='public' ? '/' : hadUser.current && signOutReason==='everywhere' ? '/auth/signin?reason=signed-out-all' : expired ? "/auth/signin?reason=expired" : "/auth/signin", { replace: true, state: { returnTo: `${location.pathname}${location.search}${location.hash}` } }); }, [loading, user, expired, signOutReason, navigate, location.pathname, location.search, location.hash]);
  if (loading || !user) return <div className="auth-route-loading"><LoadingState label={t('workspace.loading')} /></div>;
  return children;
}
