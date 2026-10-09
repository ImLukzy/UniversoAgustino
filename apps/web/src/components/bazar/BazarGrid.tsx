import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api, type HubBazarItem } from "../../lib/api";
import { CatalogGrid } from "../marketplace/CatalogGrid";

export type BazarFilter = "all" | "apuntes" | "libros" | "instrumental" | "uniformes" | "alquiler";

const MATCH: Record<BazarFilter, (b: HubBazarItem) => boolean> = {
  all: () => true,
  apuntes: (b) => b.kind === "APUNTE",
  libros: (b) => b.kind === "LIBRO",
  instrumental: (b) => b.kind === "INSTRUMENTO",
  uniformes: (b) => b.kind === "SCRUB",
  alquiler: (b) => b.tx === "ALQUILER",
};

// Grilla real del bazar: misma CatalogGrid/BazarCard que /explorar (una sola
// geometría de tarjeta en toda la app). keepPreviousData evita saltos al buscar.
export function BazarGrid({ filter, q }: { filter: BazarFilter; q: string }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["bazar", q.trim(), filter],
    placeholderData: keepPreviousData,
    queryFn: async () => (await api.get("/bazar", { params: { q: q.trim() || undefined, pageSize: 24, kind: ({ apuntes: "APUNTE", libros: "LIBRO", instrumental: "INSTRUMENTO", uniformes: "SCRUB" } as Record<string, string>)[filter], tx: filter === "alquiler" ? "ALQUILER" : undefined } })).data as { data: HubBazarItem[]; total: number },
  });
  const entries = (data?.data ?? []).filter(MATCH[filter]).map((item) => ({ kind: "bazar" as const, item }));
  return <CatalogGrid entries={entries} loading={isLoading} error={isError} onRetry={() => void refetch()} />;
}
