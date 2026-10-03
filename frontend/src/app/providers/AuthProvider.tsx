import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { AuthContext, useAuth, type Account } from "./authContext";
import type { Verification } from '../../features/account/contracts';
import { useLocale } from '../../hooks/usePreferences';
import { accountRequest } from '../../features/account/api';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Account | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [csrf, setCsrf] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending,setPending]=useState<Verification|null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const clearError = useCallback(() => setError(null), []);
  useEffect(() => {
    let active = true;
    Promise.all([request<{ csrfToken: string }>("/csrf"), request<{ authenticated: boolean; expired?: boolean; user?: Account; expiresAt?: string }>("/session")])
      .then(([challenge, session]) => { if (active) { setCsrf(challenge.csrfToken); setUser(session.authenticated ? session.user ?? null : null); setExpiresAt(session.authenticated ? session.expiresAt ?? null : null); setExpired(session.expired === true); } })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const invalid = () => { setUser(null); setExpiresAt(null); setExpired(true); };
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
      setCsrf(response.csrfToken); setUser(response.user); setExpiresAt(response.expiresAt); setExpired(false);
      const state = location.state as { returnTo?: unknown } | null;
      const returnTo = typeof state?.returnTo === "string" && state.returnTo.startsWith("/") && !state.returnTo.startsWith("//") && !state.returnTo.startsWith("/auth/") ? state.returnTo : "/intelligence";
      navigate(returnTo, { replace: true });
    } catch (cause) { const message = cause instanceof Error ? cause.message : ""; setError(message.includes(":") ? message.slice(message.indexOf(":") + 1) : "The service could not be reached. Try again."); throw cause; }
  }, [csrf, location.state, navigate]);
  const signIn = useCallback((email: string, password: string) => authenticate("/login", { email, password }), [authenticate]);
  const refreshUser=useCallback(async()=>{ const response=await request<{user:Account}>('/me'); setUser(response.user); },[]);
  const verifyEmail=useCallback(async(code:string)=>{
    const response=await accountRequest<AuthResponse>('/auth/verification/confirm',csrf,'POST',{code});
    setUser(response.user);setExpiresAt(response.expiresAt);setCsrf(response.csrfToken);setExpired(false);setPending(null);
    const state=location.state as {returnTo?:unknown}|null;
    const destination=typeof state?.returnTo==='string' && state.returnTo.startsWith('/') && !state.returnTo.startsWith('//') && !state.returnTo.startsWith('/auth/') ? state.returnTo : '/onboarding';
    navigate(destination,{replace:true});
  },[csrf,location.state,navigate]);
  const signUp = useCallback((name: string, email: string, password: string) => authenticate("/register", { name, email, password }), [authenticate]);
  const signOut = useCallback(async () => {
    setError(null);
    try { const challenge = csrf || (await request<{ csrfToken: string }>("/csrf")).csrfToken; await request<{ signedOut: boolean }>("/logout", "POST", undefined, challenge); setUser(null); setExpiresAt(null); setCsrf(""); setExpired(false); navigate("/", { replace: true }); }
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
  const value = useMemo(() => ({ user, loading, expired, csrf, error, pending, verifyEmail, refreshUser, clearError, signIn, signUp, signOut }), [user, loading, expired, csrf, error, pending, verifyEmail, refreshUser, clearError, signIn, signUp, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { t }=useLocale();
  const { user, loading, expired } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate(expired ? "/auth/signin?reason=expired" : "/auth/signin", { replace: true, state: { returnTo: `${location.pathname}${location.search}${location.hash}` } }); }, [loading, user, expired, navigate, location.pathname, location.search, location.hash]);
  if (loading || !user) return <div className="auth-route-loading" role="status">{t('workspace.loading')}</div>;
  return children;
}
