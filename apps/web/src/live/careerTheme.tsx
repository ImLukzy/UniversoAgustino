import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { UNSA_CAREERS, careerOf, type UnsaCareer } from "../data/unsa";
import { useAuth } from "../auth/AuthContext";

const KEYS = UNSA_CAREERS.map((c) => c.key);
const STORE = "hub_career";
const valid = (c: string | null | undefined) => (c && (c === "all" || KEYS.includes(c)) ? c : "all");

interface CareerTheme {
  career: string;
  setCareer: (c: string) => void;
  accent: UnsaCareer | null;
}

function hexToRgbTriplet(hex: string): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

const Ctx = createContext<CareerTheme>({ career: "all", setCareer: () => {}, accent: null });

// Tema global: todo acento de la página (barra superior, filtros, precios, botones)
// toma el color de la carrera elegida o la del perfil al iniciar sesión.
export function CareerThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [career, setCareerRaw] = useState<string>(() => {
    try {
      const u = new URLSearchParams(window.location.search).get("career");
      if (u && (u === "all" || KEYS.includes(u))) return u;
      return valid(localStorage.getItem(STORE));
    } catch {
      return "all";
    }
  });

  const setCareer = useCallback((c: string) => {
    const v = valid(c);
    try {
      localStorage.setItem(STORE, v);
    } catch {
      /* sin storage */
    }
    setCareerRaw(v);
  }, []);

  // Al entrar, si no hay elección explícita (URL o guardada), usa la carrera del perfil.
  useEffect(() => {
    let hasParam = false;
    let stored: string | null = null;
    try {
      hasParam = new URLSearchParams(window.location.search).has("career");
      stored = localStorage.getItem(STORE);
    } catch {
      /* noop */
    }
    const pc = user?.profile?.career;
    if (!hasParam && !stored && pc && KEYS.includes(pc)) setCareerRaw(pc);
  }, [user]);

  // Puente para fragmentos fuera de React si hiciera falta: window.__hubCareer("MEDICINA")
  useEffect(() => {
    (window as unknown as { __hubCareer?: (c: string) => void }).__hubCareer = setCareer;
  }, [setCareer]);

  const accent = career === "all" ? null : careerOf(career);

  // El color primario de TODA la app (todas las pestañas) sigue a la carrera:
  // primary y primary-container de Tailwind leen --hub-p. Sin carrera → teal por defecto.
  useEffect(() => {
    try {
      if (accent) document.documentElement.style.setProperty("--hub-p", hexToRgbTriplet(accent.color));
      else document.documentElement.style.removeProperty("--hub-p");
    } catch {
      /* sin DOM */
    }
  }, [accent]);

  const value = useMemo(() => ({ career, setCareer, accent }), [career, setCareer, accent]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCareerTheme(): CareerTheme {
  return useContext(Ctx);
}
