import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, apiError } from "../../lib/api";

type Kind = "WARNING" | "SUSPENSION" | "BAN";
const LABELS: Record<Kind, string> = { WARNING: "Advertencia", SUSPENSION: "Suspensión", BAN: "Bloqueo (BAN)" };
// El Trabajador solo advierte; el Técnico elige también suspensión y bloqueo (spec 33).
export function SanctionForm({ userId, admin, done }: { userId: string; admin: boolean; done: () => void }) {
  const [kind, setKind] = useState<Kind>("WARNING"), [reason, setReason] = useState(""), [days, setDays] = useState(7);
  const send = useMutation({ mutationFn: async () => { await api.post(`/staff/users/${userId}/sanctions`, { kind, reason, ...(kind === "SUSPENSION" ? { days } : {}) }); },
    onSuccess: () => { setReason(""); done(); } });
  const submit = (e: FormEvent) => { e.preventDefault(); if (window.confirm(`¿Aplicar ${LABELS[kind].toLowerCase()}? Se avisará a la persona.`)) send.mutate(); };
  return <form onSubmit={submit} className="flex min-w-0 flex-col gap-2" aria-label="Aplicar sanción">
    {admin && <label className="flex flex-col gap-1 text-sm" htmlFor={`kind-${userId}`}>Tipo
      <select id={`kind-${userId}`} className="input w-48" value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
        {(Object.keys(LABELS) as Kind[]).map((k) => <option key={k} value={k}>{LABELS[k]}</option>)}</select></label>}
    {kind === "SUSPENSION" && <label className="flex flex-col gap-1 text-sm" htmlFor={`days-${userId}`}>Días (1–30)
      <input id={`days-${userId}`} className="input w-24" type="number" min={1} max={30} value={days} onChange={(e) => setDays(Number(e.target.value))} /></label>}
    <label className="flex flex-col gap-1 text-sm" htmlFor={`reason-${userId}`}>Motivo (obligatorio, 5–300)
      <textarea id={`reason-${userId}`} className="input min-h-20" required minLength={5} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
    {send.isError && <p role="alert" className="break-words text-sm text-[#b91c1c]">{apiError(send.error)}</p>}
    <button type="submit" className="btn btn-secondary btn-sm self-start" disabled={send.isPending || reason.trim().length < 5}>Aplicar {LABELS[kind].toLowerCase()}</button>
  </form>;
}
