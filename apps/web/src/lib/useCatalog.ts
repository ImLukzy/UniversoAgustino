import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api, type HubBazarItem, type HubDocument } from "./api";

export type CatalogFilter = "all" | "docs" | "free" | "bazar";
export type CatalogEntry = { kind: "doc"; item: HubDocument } | { kind: "bazar"; item: HubBazarItem };

const PAGE = 24;

// Spec 07: sin endpoint unificado en v1. Se combinan GET /documents y GET /bazar
// según el filtro activo; "Gratis" filtra en cliente (priceCents === 0) porque
// la API aún no expone ese filtro. keepPreviousData mantiene la grilla al
// cambiar de filtro (CLS≈0).
export function useCatalog(filter: CatalogFilter, q: string, career: string) {
  const term = q.trim() || undefined;
  const wantDocs = filter !== "bazar";
  const wantBazar = filter === "all" || filter === "bazar";

  const docs = useQuery({
    queryKey: ["home-docs", term ?? "", career],
    enabled: wantDocs,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const params: Record<string, unknown> = { pageSize: PAGE, page: 1, university: "UNSA", q: term };
      if (career && career !== "all") params.career = career;
      return (await api.get("/documents", { params })).data as { data: HubDocument[]; total: number };
    },
  });

  const bazar = useQuery({
    queryKey: ["bazar", term ?? ""],
    enabled: wantBazar,
    placeholderData: keepPreviousData,
    queryFn: async () => (await api.get("/bazar", { params: { pageSize: PAGE, q: term } })).data as { data: HubBazarItem[]; total: number },
  });

  const docRows = wantDocs ? (docs.data?.data ?? []).filter((d) => filter !== "free" || d.priceCents === 0) : [];
  const bazarRows = wantBazar ? (bazar.data?.data ?? []) : [];
  const entries: CatalogEntry[] = [
    ...docRows.map((item) => ({ kind: "doc" as const, item })),
    ...bazarRows.map((item) => ({ kind: "bazar" as const, item })),
  ];
  // Mezcla cronológica: lo más reciente primero, sin importar el tipo.
  entries.sort((a, b) => (b.item.createdAt ?? "").localeCompare(a.item.createdAt ?? ""));

  const loading = (wantDocs && docs.isLoading) || (wantBazar && bazar.isLoading);
  const error = (wantDocs && docs.isError) || (wantBazar && bazar.isError);
  return { entries, loading, error, refetch: () => void Promise.all([docs.refetch(), bazar.refetch()]) };
}
