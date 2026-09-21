import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { api, setAccessToken, type HubUser } from "../lib/api";

interface AuthState {
  user: HubUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; fullName: string; university: string; career?: string; cycle?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<HubUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    try {
      const r = await api.get("/auth/me");
      setUser(r.data.data);
    } catch {
      // El interceptor ya intentó rotar vía /auth/refresh; si seguimos
      // aquí, no hay sesión válida.
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Bootstrap: /auth/me dispara la rotación silenciosa vía interceptor si
    // el access venció pero la cookie de refresh sigue válida (Sprint 1A).
    let cancelled = false;
    void (async () => {
      try {
        const r = await api.get("/auth/me");
        if (!cancelled) setUser(r.data.data);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    const onLogout = () => setUser(null);
    window.addEventListener("auth:logout", onLogout);
    return () => {
      cancelled = true;
      window.removeEventListener("auth:logout", onLogout);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api.post("/auth/login", { email, password });
    setAccessToken(r.data.data.access);
    const me = await api.get("/auth/me");
    setUser(me.data.data);
  }, []);

  const register = useCallback(async (input: { email: string; password: string; fullName: string; university: string; career?: string; cycle?: string }) => {
    const r = await api.post("/auth/register", input);
    // /register devuelve access directo
    if (r.data?.data?.access) setAccessToken(r.data.data.access);
    try {
      const me = await api.get("/auth/me");
      setUser(me.data.data);
    } catch {
      setUser({ id: r.data.data.id, email: r.data.data.email, role: r.data.data.role, profile: r.data.data.profile });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* noop */
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout, refreshMe }), [user, loading, login, register, logout, refreshMe]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return v;
}
