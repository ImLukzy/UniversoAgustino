import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, apiError } from "../../lib/api";
import { caseTime, type CaseSave } from "./caseTypes";

type Slot = { sedeId: string; sedeName: string; startsAt: string };
export function AppointmentForm({ caseId, kind, previousId, busy, save }: { caseId: string; kind: "DROP_OFF" | "PICKUP"; previousId?: string; busy: boolean; save: CaseSave }) {
  const [selected, setSelected] = useState("");
  const slots = useQuery({ queryKey: ["staff", "case-slots", caseId, kind],
    queryFn: async () => (await api.get(`/staff/cases/${caseId}/slots`, { params: { kind } })).data.data as Slot[] });
  const slot = slots.data?.find((s) => `${s.sedeId}|${s.startsAt}` === selected);
  return <form className="flex min-w-0 flex-col gap-2" onSubmit={(e) => { e.preventDefault();
    if (slot) void save(previousId ? `/staff/cases/${caseId}/appointments/${previousId}/reschedule` : `/staff/cases/${caseId}/appointments`, { kind, sedeId: slot.sedeId, startsAt: slot.startsAt }); }}>
    <label className="flex min-w-0 flex-col gap-1 text-sm" htmlFor={`slot-${caseId}`}>{previousId ? "Reprogramar" : "Programar"} {kind === "DROP_OFF" ? "entrega" : "recojo"} · hora de Lima
      <select required id={`slot-${caseId}`} className="input w-full min-w-0" value={selected} onChange={(e) => setSelected(e.target.value)}>
        <option value="">Selecciona sede y franja</option>{slots.data?.map((s) => <option key={`${s.sedeId}|${s.startsAt}`} value={`${s.sedeId}|${s.startsAt}`}>{s.sedeName} · {caseTime(s.startsAt)}</option>)}
      </select></label>
    {slots.error && <p role="alert">{apiError(slots.error)}</p>}
    {!slots.isPending && !slots.error && !slots.data?.length && <p className="text-sm">Sin franjas disponibles dentro del plazo. Solicita revisión al Técnico.</p>}
    <button type="submit" disabled={busy || !slot} className="btn btn-primary self-start">Guardar cita</button>
  </form>;
}
