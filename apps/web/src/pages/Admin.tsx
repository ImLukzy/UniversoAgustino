import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, apiError } from "../lib/api";
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
        <div className="card p-6">Solo <b>moderator/admin</b>. Tu rol: <span className="badge-uni">{user.role}</span>. Entra como <code>admin@hub.local / Admin1234!</code></div>
      </main>
    );

  return (
    <main className="mx-auto max-w-4xl space-y-3 px-4 py-8">
      <h1 className="font-display text-2xl font-extrabold">Moderación D.L. 822 (takedown &lt;48h)</h1>
      {msg && <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800">{msg}</p>}
      {reports.isLoading && <p>Cargando reportes…</p>}
      {reports.data?.length === 0 && <div className="card p-6 text-sm">Sin reportes. Usa el formulario legal para crear uno.</div>}
      {reports.data?.map((r) => (
        <div key={r.id} className="card p-4 text-sm">
          <p className="font-bold">{r.targetType} · {r.targetId}</p>
          <p className="mt-1 text-slate-600">{r.reason}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="badge-uni">{r.status}</span>
            <button onClick={() => act.mutate({ id: r.id, decision: "ACTIONED" })} className="btn-primary text-sm">Aplicar takedown</button>
            <button onClick={() => act.mutate({ id: r.id, decision: "DISMISSED" })} className="rounded-lg border px-3 py-1.5 text-sm font-semibold">Desestimar</button>
          </div>
        </div>
      ))}
    </main>
  );
}

export function LegalFuncional() {
  const [form, setForm] = useState({ targetType: "document", targetId: "", reason: "" });
  const [msg, setMsg] = useState("");
  const [summary, setSummary] = useState<{ law: string; takedownSlaHours: number; allowed: string[]; forbidden: string[] } | null>(null);

  const loadSummary = async () => {
    try {
      const r = await api.get("/legal/summary");
      setSummary(r.data.data);
    } catch (e) {
      setMsg(apiError(e));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    try {
      await api.post("/reports", form);
      setMsg("Reporte enviado. Moderación responde en <48h (D.L. 822).");
      setForm({ targetType: "document", targetId: "", reason: "" });
    } catch (ex) {
      setMsg(apiError(ex));
    }
  };

  return (
    <section className="mx-auto max-w-3xl space-y-3 px-4 py-6">
      <div className="card p-4">
        <h2 className="font-display font-bold">Canal legal funcional (conectado a API)</h2>
        <div className="mt-2 flex gap-2">
          <button onClick={loadSummary} className="rounded-lg border px-3 py-1.5 text-sm font-semibold">Ver resumen D.L. 822</button>
        </div>
        {summary && (
          <div className="mt-2 text-sm">
            <p className="font-semibold">{summary.law} · SLA {summary.takedownSlaHours}h</p>
            <p className="mt-1">Permitido: {summary.allowed.join(" · ")}</p>
            <p>Prohibido: {summary.forbidden.join(" · ")}</p>
          </div>
        )}
        <form onSubmit={submit} className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <select className="input" value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value })}>
              <option value="document">document</option>
              <option value="bazar">bazar</option>
              <option value="user">user</option>
            </select>
            <input className="input" placeholder="ID objetivo" value={form.targetId} onChange={(e) => setForm({ ...form, targetId: e.target.value })} required />
          </div>
          <textarea className="input" placeholder="Motivo (mín. 10 caracteres)" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required minLength={10} rows={3} />
          <button className="btn-primary">Enviar reporte</button>
        </form>
        {msg && <p className="mt-2 text-sm font-semibold text-teal-800">{msg}</p>}
      </div>
    </section>
  );
}
