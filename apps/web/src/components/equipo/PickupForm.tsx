import { PhysicalPaymentFields, paymentReady, type PhysicalPayment } from "./PhysicalPaymentFields";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, apiError } from "../../lib/api";
import { caseTime, type CaseSave } from "./caseTypes";

type Slot = { sedeId: string; sedeName: string; startsAt: string };
export function PickupForm({ caseId, rental, amountCents, busy, save }: { caseId: string; rental: boolean; amountCents: number; busy: boolean; save: CaseSave }) {
  const [payment, setPayment] = useState<PhysicalPayment>({ method: "OPERATION", accountId: "", proofUrl: "", reference: "", confirmed: false, uploading: false });
  const [selected, setSelected] = useState("");
  const slots = useQuery({ queryKey: ["staff", "case-slots", caseId, "RETURN"], enabled: rental,
    queryFn: async () => (await api.get(`/staff/cases/${caseId}/slots`, { params: { kind: "RETURN" } })).data.data as Slot[] });
  const slot = slots.data?.find((s) => `${s.sedeId}|${s.startsAt}` === selected);
  return <form className="flex min-w-0 flex-col gap-3" onSubmit={(e) => { e.preventDefault(); if (busy || !paymentReady(payment)) return;
    void save(`/staff/cases/${caseId}/pickup`, { paymentMethod: payment.method, paymentRef: payment.method === "OPERATION" ? payment.reference.trim() || undefined : undefined, paymentConfirmed: payment.confirmed,
      paymentAccountId: payment.method === "OPERATION" ? payment.accountId : undefined, paymentProofUrl: payment.method === "OPERATION" ? payment.proofUrl : undefined,
      returnAppointment: slot ? { kind: "RETURN", sedeId: slot.sedeId, startsAt: slot.startsAt } : undefined }); }}>
    <h3 className="font-bold">Entregar al comprador</h3>
    <PhysicalPaymentFields value={payment} setValue={setPayment} amountCents={amountCents} busy={busy} />
    {rental && <><label className="flex min-w-0 flex-col gap-1 text-sm" htmlFor={`return-slot-${caseId}`}>Cita de devolución · hora de Lima
      <select id={`return-slot-${caseId}`} className="input w-full min-w-0" value={selected} onChange={(e) => setSelected(e.target.value)}>
        <option value="">Programar después</option>{slots.data?.map((s) => <option key={`${s.sedeId}|${s.startsAt}`} value={`${s.sedeId}|${s.startsAt}`}>{s.sedeName} · {caseTime(s.startsAt)}</option>)}
      </select></label><p className="text-sm">La devolución se programa desde la fecha final, en días hábiles con turno. Las fechas acordadas del alquiler se conservan.</p>
      {slots.error && <p role="status" className="break-words text-sm">{apiError(slots.error)}. El Técnico puede revisar la disponibilidad después del recojo.</p>}</>}
    <button type="submit" disabled={busy || !paymentReady(payment)} className="btn btn-primary self-start">Registrar pago y entregar</button>
  </form>;
}
