import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiError, fmtDate } from "../../lib/api";
import { useAuth } from "../../auth/AuthContext";

import { roleLabel } from "../../lib/roles";
import { PanelLoading } from "../teamPanel/PanelLoading";

interface Member { id: string; email: string; fullName: string; role: "moderator" | "admin"; since: string }
export function MiembrosTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const key = ["staff", "members", user?.id];
  const members = useQuery({ queryKey: key, enabled: user?.role === "admin",
    queryFn: async () => (await api.get("/staff/members")).data.data as Member[] });
  const change = useMutation({
    mutationFn: async (action: { email: string } | { id: string }) => "email" in action ?
      api.post("/staff/members", action) : api.delete(`/staff/members/${encodeURIComponent(action.id)}`),
    onSuccess: () => { setEmail(""); setMsg("Equipo actualizado."); void qc.invalidateQueries({ queryKey: key }); },
    onError: (error) => setMsg(apiError(error)),
  });
  function submit(event: FormEvent) { event.preventDefault(); setMsg(""); change.mutate({ email }); }
  function remove(member: Member) {
    if (window.confirm(`¿Quitar a ${member.email} del equipo?`)) { setMsg(""); change.mutate({ id: member.id }); }
  }
  if (user?.role !== "admin") return null;
  return (
    <section className="flex min-w-0 flex-col gap-4" aria-label="Miembros del equipo">
      <form onSubmit={submit} className="card flex min-w-0 flex-col gap-3 p-5">
        <h2 className="h-display text-xl">Añadir por correo</h2>
        <label htmlFor="staff-email" className="text-sm font-bold">Correo institucional</label>
        <input id="staff-email" type="email" required maxLength={160} value={email} onChange={(e) => setEmail(e.target.value)}
          className="input w-full min-w-0" placeholder="nombre@unsa.edu.pe" autoComplete="email" />
        <button type="submit" className="btn btn-primary w-fit" disabled={change.isPending}>Añadir al equipo</button>
        <p role="status" className={msg ? "break-words text-sm" : "sr-only"}>{msg}</p>
      </form>
      {members.isPending && <PanelLoading label="Cargando miembros…" />}
      {members.isError && <p role="alert">{apiError(members.error)}</p>}
      {members.data?.map((member) => <article key={member.id} className="card flex min-w-0 flex-wrap items-center gap-3 p-5">
        <div className="w-full min-w-0 flex-none break-words sm:w-auto sm:flex-1"><h3 className="font-bold">{member.fullName || member.email}</h3>
          <p className="break-all text-sm text-zinc-600">{member.email}</p>
          <p className="text-xs text-zinc-500">Desde {fmtDate(member.since)}</p></div>
        <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
        <span className="chip">{roleLabel(member.role)}</span>
        {member.role !== "admin" && member.id !== user.id && <button type="button" onClick={() => remove(member)}
          className="btn btn-secondary btn-sm" disabled={change.isPending}>Quitar</button>}
        </div>
      </article>)}
    </section>
  );
}
