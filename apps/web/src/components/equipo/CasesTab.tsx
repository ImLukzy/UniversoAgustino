import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthContext";
import { api, apiError } from "../../lib/api";
import { CaseCard } from "./CaseCard";
import { CASE_LABELS, type StaffCase, type CaseSave } from "./caseTypes";

export function CasesTab() {
  const { user } = useAuth(), qc = useQueryClient();
  const [assigneeId, setAssigneeId] = useState("");
  const members = useQuery({ queryKey: ["staff", "case-members"], enabled: user?.role === "admin", queryFn: async () => (await api.get("/staff/members")).data.data as { id: string; fullName: string; email: string }[] });
  const [status, setStatus] = useState(""), [page, setPage] = useState(1), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const list = useQuery({ refetchInterval: 30_000, queryKey: ["staff", "cases", user?.id, status, page, assigneeId], queryFn: async () => (await api.get("/staff/cases", { params: { page, ...(assigneeId ? { assigneeId } : {}), ...(status ? { status } : {}) } })).data as { data: StaffCase[]; meta: { total: number } } });
  const save: CaseSave = async (path, body) => {
    setBusy(true); setMessage("");
    try { await api.post(path, body); setMessage("Caso actualizado."); await qc.invalidateQueries({ queryKey: ["staff"] }); return true; }
    catch (error) { setMessage(apiError(error)); return false; } finally { setBusy(false); }
  };
  return <div className="flex min-w-0 flex-col gap-4">
    <label className="flex flex-col gap-1 text-sm" htmlFor="case-status">Estado
      <select id="case-status" className="input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
        <option value="">Todos los estados</option>{Object.entries(CASE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select></label><p role="status" className="min-h-6 break-words text-sm">{message}</p>
    {user?.role === "admin" && <label className="flex flex-col gap-1 text-sm" htmlFor="case-assignee">Custodio
      <select id="case-assignee" className="input" value={assigneeId} onChange={(e) => { setAssigneeId(e.target.value); setPage(1); }}>
        <option value="">Todos los custodios</option>{members.data?.map((m) => <option key={m.id} value={m.id}>{m.fullName || m.email}</option>)}
      </select></label>}
    {list.isPending && <p role="status" className="min-h-64">Cargando casos…</p>}{list.error && <p role="alert">{apiError(list.error)}</p>}
    {list.data?.data.map((row) => <CaseCard key={row.id} row={row} userId={user?.id ?? ""} admin={user?.role === "admin"} busy={busy} save={save} />)}
    {list.data && !list.data.data.length && <p>No hay casos en este filtro.</p>}
    <nav aria-label="Páginas de casos" className="flex flex-wrap gap-2"><button type="button" className="btn btn-secondary" disabled={page === 1 || list.isPending} onClick={() => setPage((p) => p - 1)}>Anterior</button>
      <span className="self-center text-sm">Página {page}</span><button type="button" className="btn btn-secondary" disabled={!list.data || page * 20 >= list.data.meta.total} onClick={() => setPage((p) => p + 1)}>Siguiente</button></nav>
  </div>;
}
