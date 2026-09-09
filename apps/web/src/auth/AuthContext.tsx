import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { api, type HubUser } from "../lib/api";

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
    const token = localStorage.getItem("hub_access");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const r = await api.get("/auth/me");
      setUser(r.data.data);
    } catch {
      localStorage.removeItem("hub_access");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api.post("/auth/login", { email, password });
    localStorage.setItem("hub_access", r.data.data.access);
    const me = await api.get("/auth/me");
    setUser(me.data.data);
  }, []);

  const register = useCallback(async (input: { email: string; password: string; fullName: string; university: string; career?: string; cycle?: string }) => {
    const r = await api.post("/auth/register", input);
    // /register devuelve access directo
    if (r.data?.data?.access) localStorage.setItem("hub_access", r.data.data.access);
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
    localStorage.removeItem("hub_access");
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
