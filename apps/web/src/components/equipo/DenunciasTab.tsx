import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, apiError } from "../../lib/api";
import { ITEM_TYPE_LABEL, REPORT_STATUS_LABEL } from "../../lib/orderLabels";
import { useAuth } from "../../auth/AuthContext";
import { ROUTES } from "../../lib/routes";
import { PanelLoading } from "../teamPanel/PanelLoading";
import { EmptyState } from "../EmptyState";
import { LoginRequired } from "../auth/LoginRequired";

interface Report {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
}

export function DenunciasTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [msg, setMsg] = useState("");
  const reports = useQuery({
    queryKey: ["reports"],
    queryFn: async () => (await api.get("/reports")).data.data as Report[],
    enabled: !!user && (user.role === "admin" || user.role === "moderator"),
  });

  const act = useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision: string }) =>
      (await api.post(`/reports/${id}/action`, { decision })).data,
    onSuccess: () => {
      setMsg("Reporte accionado (si era document → TAKEDOWN).");
      void qc.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (e) => setMsg(apiError(e)),
  });

  if (!user)
    return <LoginRequired what="moderar reportes" />;
  if (user.role !== "admin" && user.role !== "moderator")
    return (
      <section className="max-w-xl">
        <div className="card flex flex-col gap-2 p-8">
          <h2 className="h-display text-2xl">Acceso restringido</h2>
          <p className="text-sm text-zinc-600">La cola de moderación es solo para moderadores y administradores.</p>
        </div>
      </section>
    );

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div className="flex justify-end"><Link to={ROUTES.mySales} className="btn btn-secondary btn-sm">Gestión de ventas</Link></div>
      <p role="status" className={msg ? "text-sm font-bold text-zinc-800" : "sr-only"}>{msg}</p>
      {reports.isLoading && <PanelLoading label="Cargando denuncias…" />}
      {reports.data?.length === 0 && <EmptyState boxed icon="task_alt" title="Sin reportes pendientes" />}
      {reports.data?.map((r) => (
        <article key={r.id} className="card flex min-w-0 flex-col gap-2 break-words p-5 text-sm">
          <p className="font-extrabold text-zinc-950">{ITEM_TYPE_LABEL[r.targetType] ?? r.targetType} <span className="font-mono font-normal text-zinc-500">· Ref. {r.targetId.slice(0, 8)}…</span></p>
          <p className="text-zinc-700">{r.reason}</p>
          <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-zinc-300 pt-3">
            <span className="tag mr-auto">{REPORT_STATUS_LABEL[r.status] ?? r.status}</span>
            <button type="button" onClick={() => act.mutate({ id: r.id, decision: "ACTIONED" })} className="btn btn-primary btn-sm">Aplicar takedown</button>
            <button type="button" onClick={() => act.mutate({ id: r.id, decision: "DISMISSED" })} className="btn btn-secondary btn-sm">Desestimar</button>
          </div>
        </article>
      ))}
    </section>
  );
}
