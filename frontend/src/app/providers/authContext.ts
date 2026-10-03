import { createContext, useContext } from "react";
import type { Verification } from '../../features/account/contracts';
export interface Account { id: string; name: string; email: string; provider: string }
export interface AuthContextValue { user: Account | null; loading: boolean; expired: boolean; csrf: string; error: string | null; pending: Verification|null; verifyEmail:(code:string)=>Promise<void>; refreshUser:()=>Promise<void>; clearError: () => void; signIn: (email: string, password: string) => Promise<void>; signUp: (name: string, email: string, password: string) => Promise<void>; signOut: () => Promise<void> }
export const AuthContext = createContext<AuthContextValue | null>(null);
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error("useAuth must be used within AuthProvider"); return context; }
