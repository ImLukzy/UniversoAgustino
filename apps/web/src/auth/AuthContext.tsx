import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { api, setAccessToken, type HubUser } from "../lib/api";

interface AuthState {
  user: HubUser | null;
  loading: boolean;
  hadSession: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; fullName: string; university: string; career?: string; cycle?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const SESSION_HINT = "ua-session-hint";
function readSessionHint(): boolean {
  try { return localStorage.getItem(SESSION_HINT) === "1"; } catch { return false; }
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<HubUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [hadSession] = useState(readSessionHint);
  const updateSession = useCallback((next: HubUser | null) => {
    setUser(next);
    try {
      if (next) localStorage.setItem(SESSION_HINT, "1");
      else localStorage.removeItem(SESSION_HINT);
    } catch { /* El almacenamiento bloqueado no impide usar la sesión. */ }
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const r = await api.get("/auth/me");
      updateSession(r.data.data);
    } catch {
      // El interceptor ya intentó rotar vía /auth/refresh; si seguimos
      // aquí, no hay sesión válida.
      updateSession(null);
    } finally {
      setLoading(false);
    }
  }, [updateSession]);

  useEffect(() => {
    // Bootstrap: /auth/me dispara la rotación silenciosa vía interceptor si
    // el access venció pero la cookie de refresh sigue válida (Sprint 1A).
    let cancelled = false;
    void (async () => {
      try {
        const r = await api.get("/auth/me");
        if (!cancelled) updateSession(r.data.data);
      } catch {
        if (!cancelled) updateSession(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    const onLogout = () => updateSession(null);
    window.addEventListener("auth:logout", onLogout);
    return () => {
      cancelled = true;
      window.removeEventListener("auth:logout", onLogout);
    };
  }, [updateSession]);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api.post("/auth/login", { email, password });
    setAccessToken(r.data.data.access);
    try {
      const me = await api.get("/auth/me");
      updateSession(me.data.data);
    } catch (error) {
      updateSession(null);
      throw error;
    }
  }, [updateSession]);

  const register = useCallback(async (input: { email: string; password: string; fullName: string; university: string; career?: string; cycle?: string }) => {
    const r = await api.post("/auth/register", input);
    // /register devuelve access directo
    if (r.data?.data?.access) setAccessToken(r.data.data.access);
    try {
      const me = await api.get("/auth/me");
      updateSession(me.data.data);
    } catch {
      updateSession(null);
      setUser({ id: r.data.data.id, email: r.data.data.email, role: r.data.data.role, profile: r.data.data.profile });
    }
  }, [updateSession]);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* noop */
    }
    setAccessToken(null);
    updateSession(null);
  }, [updateSession]);

  const value = useMemo(() => ({ user, loading, hadSession, login, register, logout, refreshMe }), [user, loading, hadSession, login, register, logout, refreshMe]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return v;
}
