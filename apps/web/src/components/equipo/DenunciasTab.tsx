import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, apiError } from "../../lib/api";
import { useAuth } from "../../auth/AuthContext";
import { ROUTES } from "../../lib/routes";
import { PanelLoading } from "../teamPanel/PanelLoading";
import { EmptyState } from "../EmptyState";
import { LoginRequired } from "../auth/LoginRequired";
import { ReportCard, type ReportEntry } from "./ReportCard";

type ReportPage = { data: ReportEntry[]; total: number };
const PAGE_SIZE = 20;
const getPage = async (status: string, page: number, pageSize: number) => (await api.get("/reports", { params: { status, page, pageSize } })).data as ReportPage;

async function loadResolved(page: number) {
  const needed = page * PAGE_SIZE;
  const groups = await Promise.all(["ACTIONED", "DISMISSED"].map(async (status) => {
    const first = await getPage(status, 1, 50);
    const count = Math.min(Math.ceil(needed / 50), Math.ceil(first.total / 50));
    const rest = await Promise.all(Array.from({ length: count - 1 }, (_, index) => getPage(status, index + 2, 50)));
    return { data: [first.data, ...rest.map((result) => result.data)].flat(), total: first.total };
  }));
  const merged = groups.flatMap((group) => group.data).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { data: merged.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total: groups.reduce((sum, group) => sum + group.total, 0) };
}

export function DenunciasTab() {
  const { user } = useAuth(), qc = useQueryClient();
  const [filter, setFilter] = useState<"OPEN" | "RESOLVED">("OPEN");
  const [page, setPage] = useState(1), [busyId, setBusyId] = useState(""), [error, setError] = useState(""), [message, setMessage] = useState("");
  const reports = useQuery({ queryKey: ["reports", filter, page], enabled: user?.role === "admin" || user?.role === "moderator",
    queryFn: async () => filter === "OPEN" ? getPage("OPEN", page, PAGE_SIZE) : loadResolved(page) });
  const act = async (id: string, decision: "ACTIONED" | "DISMISSED", reason?: string) => {
    if (busyId) return;
    setBusyId(id); setError(""); setMessage("");
    try {
      await api.post(`/reports/${id}/action`, { decision, ...(reason ? { reason } : {}) });
      setMessage(decision === "ACTIONED" ? "Publicación retirada y reporte resuelto." : "Reporte desestimado.");
      void qc.invalidateQueries({ queryKey: ["reports"] });
    } catch (cause) { setError(apiError(cause)); } finally { setBusyId(""); }
  };

  if (!user) return <LoginRequired what="moderar reportes" />;
  if (user.role !== "admin" && user.role !== "moderator") return <section className="card p-8"><h2 className="h-display text-2xl">Acceso restringido</h2><p className="text-sm text-zinc-600">La cola de moderación es solo para moderadores y administradores.</p></section>;
  const total = reports.data?.total ?? 0, pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return <section className="flex min-w-0 flex-col gap-4">
    <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
      <label className="flex flex-col gap-1 text-sm" htmlFor="report-status">Estado
        <select id="report-status" className="input w-full max-w-xs" value={filter} onChange={(event) => { setFilter(event.target.value as "OPEN" | "RESOLVED"); setPage(1); }}>
          <option value="OPEN">Abiertas</option><option value="RESOLVED">Resueltas</option>
        </select>
      </label>
      <Link to={ROUTES.mySales} className="btn btn-secondary btn-sm">Gestión de ventas</Link>
    </div>
    {message && <p role="status" className="text-sm font-bold text-zinc-800">{message}</p>}
    {error && <p role="alert" className="wrap-break-word text-sm text-[#b91c1c]">{error}</p>}
    {reports.isLoading && <PanelLoading label="Cargando denuncias…" />}
    {reports.isError && <p role="alert" className="text-sm text-[#b91c1c]">{apiError(reports.error)}</p>}
    {reports.data?.data.length === 0 && <EmptyState boxed icon="task_alt" title={filter === "OPEN" ? "Sin reportes abiertos" : "Sin reportes resueltos"} />}
    {reports.data?.data.map((report) => <ReportCard key={report.id} report={report} admin={user.role === "admin"} busy={busyId === report.id} onAction={(id, decision, reason) => void act(id, decision, reason)} />)}
    {total > PAGE_SIZE && <nav className="flex items-center justify-between gap-3" aria-label="Paginación de reportes">
      <button className="btn btn-secondary btn-sm" type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Anterior</button>
      <span className="text-sm text-zinc-600">Página {page} de {pages}</span>
      <button className="btn btn-secondary btn-sm" type="button" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>Siguiente</button>
    </nav>}
  </section>;
}
