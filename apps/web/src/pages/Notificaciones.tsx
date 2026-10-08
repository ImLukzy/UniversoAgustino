import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "../components/AppLayout";
import { EmptyState } from "../components/EmptyState";
import { LoginRequired } from "../components/auth/LoginRequired";
import { NotificationList } from "../components/notificaciones/NotificationList";
import { api, apiError, type HubNotification } from "../lib/api";
import { useAuth } from "../auth/AuthContext";

const FILTERS = [{ id: "all", label: "Todas" }, { id: "unread", label: "No leídas" },
  { id: "orders", label: "Pedidos" }, { id: "publications", label: "Publicaciones" }, { id: "team", label: "Equipo" }];
interface Page { data: HubNotification[]; page: number; pageSize: number; total: number }
export function Notificaciones() {
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const notifs = useInfiniteQuery({
    queryKey: ["notifications", "mine", user?.id, filter], enabled: !!user, initialPageParam: 1,
    queryFn: async ({ pageParam }) => (await api.get("/notifications", { params: {
      page: pageParam, pageSize: 30, ...(filter === "unread" ? { unread: 1 } : {}),
      ...(!["all", "unread"].includes(filter) ? { category: filter } : {}),
    } })).data as Page,
    getNextPageParam: (page) => page.page * page.pageSize < page.total ? page.page + 1 : undefined,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["notifications"] });
  const markAll = useMutation({ mutationFn: () => api.post("/notifications/read-all"), onSuccess: refresh });
  const markOne = useMutation({
    mutationFn: async (n: HubNotification) => { if (!n.readAt) await api.post(`/notifications/${n.id}/read`); return n; },
    onSuccess: (n) => { void refresh(); if (n.link?.startsWith("/") && !n.link.startsWith("//")) nav(n.link); },
  });
  if (!user) return <AppLayout><LoginRequired what="ver tus avisos" /></AppLayout>;
  const rows = notifs.data?.pages.flatMap((p) => p.data) ?? [];
  const error = notifs.error ?? markAll.error ?? markOne.error;
  return <AppLayout><div className="flex min-w-0 flex-col gap-6">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="eyebrow">Avisos</p><h1 className="h-display mt-2 text-3xl">Mis notificaciones</h1></div>
      <button type="button" onClick={() => markAll.mutate()} disabled={markAll.isPending} className="btn btn-secondary btn-sm">Marcar todo leído</button>
    </header>
    <div role="tablist" aria-label="Filtrar notificaciones" className="flex flex-wrap gap-2">
      {FILTERS.map((f) => <button key={f.id} id={`filter-${f.id}`} type="button" role="tab" aria-selected={filter === f.id}
        aria-controls="notification-results" onClick={() => setFilter(f.id)} className={`btn btn-sm ${filter === f.id ? "btn-primary" : "btn-secondary"}`}>{f.label}</button>)}
    </div>
    {error && <p role="alert">{apiError(error)}</p>}
    <div id="notification-results" role="tabpanel" aria-labelledby={`filter-${filter}`}>
      {notifs.isPending ? <p role="status">Cargando notificaciones…</p> : rows.length === 0 ?
        <EmptyState boxed icon="notifications" title={`Sin notificaciones${filter === "all" ? "" : `: ${FILTERS.find((f) => f.id === filter)?.label}`}`} hint="Los avisos que coincidan con este filtro aparecen aquí." /> :
        <NotificationList rows={rows} open={(n) => markOne.mutate(n)} />}
    </div>
    {notifs.hasNextPage && <button type="button" className="btn btn-secondary self-start" disabled={notifs.isFetchingNextPage}
      onClick={() => void notifs.fetchNextPage()}>Ver más</button>}
  </div></AppLayout>;
}
