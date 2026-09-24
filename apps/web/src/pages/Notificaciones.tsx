import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "../components/AppLayout";
import { EmptyState } from "../components/EmptyState";
import { LoginRequired } from "../components/auth/LoginRequired";
import { api, fmtDate, type HubNotification } from "../lib/api";
import { useAuth } from "../auth/AuthContext";

// Mis notificaciones (reservas, pagos, custodia). Abrir una la marca como
// leída y navega a su enlace interno si lo tiene.
export function Notificaciones() {
  const { user } = useAuth();
  const nav = useNavigate();
  const notifs = useQuery({
    queryKey: ["notifications", "mine"],
    enabled: !!user,
    refetchInterval: 30000,
    queryFn: async () => (await api.get("/notifications", { params: { pageSize: 30 } })).data.data as HubNotification[],
  });
  if (!user) return <AppLayout><LoginRequired what="ver tus avisos" /></AppLayout>;

  const rows = notifs.data ?? [];
  const markAllRead = async () => {
    await api.post("/notifications/read-all");
    void notifs.refetch();
  };
  const open = async (n: HubNotification) => {
    if (!n.readAt) {
      await api.post(`/notifications/${n.id}/read`).catch(() => undefined);
      void notifs.refetch();
    }
    if (n.link?.startsWith("/")) nav(n.link);
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <header className="flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Avisos</p>
            <h1 className="h-display mt-2 text-3xl">Mis notificaciones</h1>
          </div>
          {rows.some((n) => !n.readAt) && <button type="button" onClick={() => void markAllRead()} className="btn btn-secondary btn-sm">Marcar leídas</button>}
        </header>
        {notifs.isLoading ? (
          <div className="flex flex-col gap-3" aria-label="Cargando notificaciones">
            {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-zinc-100" aria-hidden="true" />)}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState boxed icon="notifications" title="Sin notificaciones" hint="Tus reservas, pagos y avisos de custodia aparecen aquí." />
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((n) => (
              <li key={n.id}>
                <button type="button" onClick={() => void open(n)} className={`card card-hover flex w-full flex-col gap-1 p-4 text-left ${n.readAt ? "" : "bg-primary-soft"}`}>
                  <span className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2 font-extrabold text-zinc-950">
                      {!n.readAt && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-label="No leída" />}
                      <span className="truncate">{n.title}</span>
                    </span>
                    <span className="shrink-0 text-xs text-zinc-500">{fmtDate(n.createdAt)}</span>
                  </span>
                  <span className="text-sm text-zinc-600">{n.body}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  );
}
