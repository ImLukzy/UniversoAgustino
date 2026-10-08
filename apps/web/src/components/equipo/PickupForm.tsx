import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, apiError } from "../../lib/api";
import { caseTime, type CaseSave } from "./caseTypes";

type Slot = { sedeId: string; sedeName: string; startsAt: string };
export function PickupForm({ caseId, rental, busy, save }: { caseId: string; rental: boolean; busy: boolean; save: CaseSave }) {
  const [method, setMethod] = useState("OPERATION"), [reference, setReference] = useState(""), [confirmed, setConfirmed] = useState(false), [selected, setSelected] = useState("");
  const slots = useQuery({ queryKey: ["staff", "case-slots", caseId, "RETURN"], enabled: rental,
    queryFn: async () => (await api.get(`/staff/cases/${caseId}/slots`, { params: { kind: "RETURN" } })).data.data as Slot[] });
  const slot = slots.data?.find((s) => `${s.sedeId}|${s.startsAt}` === selected);
  return <form className="flex min-w-0 flex-col gap-3" onSubmit={(e) => { e.preventDefault();
    void save(`/staff/cases/${caseId}/pickup`, { paymentMethod: method, paymentRef: method === "OPERATION" ? reference.trim() : undefined, paymentConfirmed: confirmed,
      returnAppointment: slot ? { kind: "RETURN", sedeId: slot.sedeId, startsAt: slot.startsAt } : undefined }); }}>
    <h3 className="font-bold">Entregar al comprador</h3>
    <label className="flex flex-col gap-1 text-sm" htmlFor={`method-${caseId}`}>Pago al vendedor
      <select id={`method-${caseId}`} className="input" value={method} onChange={(e) => { setMethod(e.target.value); setConfirmed(false); }}>
        <option value="OPERATION">N.º de operación</option><option value="CASH">Efectivo</option>
      </select></label>
    {method === "OPERATION" && <label className="flex flex-col gap-1 text-sm" htmlFor={`reference-${caseId}`}>N.º de operación (3–160 caracteres)
      <input id={`reference-${caseId}`} required minLength={3} maxLength={160} value={reference} onChange={(e) => setReference(e.target.value)} className="input" /></label>}
    {rental && <><label className="flex min-w-0 flex-col gap-1 text-sm" htmlFor={`return-slot-${caseId}`}>Cita de devolución · hora de Lima
      <select id={`return-slot-${caseId}`} className="input w-full min-w-0" value={selected} onChange={(e) => setSelected(e.target.value)}>
        <option value="">Programar después</option>{slots.data?.map((s) => <option key={`${s.sedeId}|${s.startsAt}`} value={`${s.sedeId}|${s.startsAt}`}>{s.sedeName} · {caseTime(s.startsAt)}</option>)}
      </select></label><p className="text-sm">La devolución se programa desde la fecha final, en días hábiles con turno. Las fechas acordadas del alquiler se conservan.</p>
      {slots.error && <p role="status" className="break-words text-sm">{apiError(slots.error)}. El Técnico puede revisar la disponibilidad después del recojo.</p>}</>}
    <label className="flex items-start gap-2 text-sm" htmlFor={`payment-confirm-${caseId}`}><input id={`payment-confirm-${caseId}`} type="checkbox" required checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
      Confirmo que el comprador pagó al vendedor delante de mí{method === "CASH" ? " en efectivo" : " y verifiqué la operación"}.</label>
    <button type="submit" disabled={busy || !confirmed || (method === "OPERATION" && reference.trim().length < 3)} className="btn btn-primary self-start">Registrar pago y entregar</button>
  </form>;
}
