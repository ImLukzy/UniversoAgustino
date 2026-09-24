import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { UNSA_CAREERS } from "../data/unsa";
import { useCareerTheme } from "../live/careerTheme";
import type { CatalogFilter } from "./useCatalog";

const FILTERS: CatalogFilter[] = ["all", "docs", "free", "bazar"];
const KEYS = new Set(UNSA_CAREERS.map((c) => c.key));
const isCareer = (c: string | null): c is string => !!c && (c === "all" || KEYS.has(c));

// Estado de /explorar sincronizado con la URL (?q=, ?f=, ?career=).
// ?career= manda: al llegar (o al navegar atrás/adelante) aplica esa carrera al
// tema global (spec 05) y filtra el catálogo; si la carrera cambia desde otro
// control, la URL se actualiza con replace para que el enlace sea compartible.
export function useExploreParams() {
  const [params, setParams] = useSearchParams();
  const { career, setCareer } = useCareerTheme();
  const [q, setQ] = useState(() => params.get("q") ?? "");
  const [filter, setFilter] = useState<CatalogFilter>(() => FILTERS.find((f) => f === params.get("f")) ?? "all");
  const urlCareer = params.get("career");

  const applied = useRef<string | null>(null);
  const pending = useRef(false);

  useEffect(() => {
    if (!isCareer(urlCareer) || applied.current === urlCareer) return;
    applied.current = urlCareer;
    if (urlCareer !== career) {
      pending.current = true;
      setCareer(urlCareer);
    }
  }, [urlCareer, career, setCareer]);

  useEffect(() => {
    const next = new URLSearchParams(params);
    const put = (k: string, v: string, empty: string) => (v && v !== empty ? next.set(k, v) : next.delete(k));
    put("q", q.trim(), "");
    put("f", filter, "all");
    // Mientras la carrera de la URL se aplica al tema, no se pisa.
    if (pending.current && career === urlCareer) pending.current = false;
    if (!pending.current) put("career", career, "all");
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
  }, [q, filter, career, urlCareer, params, setParams]);

  return { q, setQ, filter, setFilter, career, setCareer };
}
