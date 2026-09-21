import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, apiError } from "../lib/api";
import { ITEM_TYPE_LABEL, REPORT_STATUS_LABEL } from "../lib/orderLabels";
import { useAuth } from "../auth/AuthContext";

interface Report {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
}

export function Admin() {
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
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (e) => setMsg(apiError(e)),
  });

  if (!user)
    return (
      <main className="mx-auto max-w-xl px-4 py-10"><div className="card p-6">Debes <Link className="underline" to="/login">entrar</Link>.</div></main>
    );
  if (user.role !== "admin" && user.role !== "moderator")
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="card p-6">Solo <b>moderator/admin</b>. Tu rol: <span className="badge-uni">{user.role}</span>. Entra como <code>admin@unsa.edu.pe / Admin1234!</code></div>
      </main>
    );

  return (
    <main className="mx-auto max-w-4xl space-y-3 px-4 py-8">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="font-display text-2xl font-extrabold">Moderación · Reportes D.L. 822</h1>
        <Link to="/ventas" className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-primary hover:bg-slate-200">
          Ir a Gestión de Ventas →
        </Link>
      </div>
      <p className="text-xs text-slate-500">Cola global (takedown &lt;48h). Tus alquileres y ventas propias se gestionan en Gestión de Ventas.</p>
      {msg && <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">{msg}</p>}
      {reports.isLoading && <p>Cargando reportes…</p>}
      {reports.data?.length === 0 && <div className="card p-6 text-sm">Sin reportes. Usa el formulario legal para crear uno.</div>}
      {reports.data?.map((r) => (
        <div key={r.id} className="card p-4 text-sm">
          <p className="font-bold">{ITEM_TYPE_LABEL[r.targetType] ?? r.targetType} · <span className="font-mono font-normal text-slate-500">Ref. {r.targetId.slice(0, 8)}…</span></p>
          <p className="mt-1 text-slate-600">{r.reason}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="badge-uni">{REPORT_STATUS_LABEL[r.status] ?? r.status}</span>
            <button onClick={() => act.mutate({ id: r.id, decision: "ACTIONED" })} className="btn-primary text-sm">Aplicar takedown</button>
            <button onClick={() => act.mutate({ id: r.id, decision: "DISMISSED" })} className="rounded-lg border px-3 py-1.5 text-sm font-semibold">Desestimar</button>
          </div>
        </div>
      ))}
    </main>
  );
}