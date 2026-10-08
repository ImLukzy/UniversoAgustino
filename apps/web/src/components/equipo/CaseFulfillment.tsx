import { useState } from "react";
import type { AppointmentKind } from "@hub/shared";
import { AppointmentForm } from "./AppointmentForm";
import { PickupForm } from "./PickupForm";
import { ReturnForm } from "./ReturnForm";
import type { StaffCase, CaseSave } from "./caseTypes";

export function CaseFulfillment({ row, busy, save }: { row: StaffCase; busy: boolean; save: CaseSave }) {
  const [returning, setReturning] = useState(false);
  const now = Date.now(), active = (kind: AppointmentKind) => row.appointments.some((a) => a.kind === kind && a.status === "SCHEDULED" && new Date(a.startsAt).getTime() <= now && new Date(a.endsAt).getTime() >= now);
  return <div className="flex min-w-0 flex-col gap-3">
    {row.status === "PICKUP_SCHEDULED" && active("PICKUP") && <PickupForm caseId={row.id} rental={!!row.order.rentalEnd} busy={busy} save={save} />}
    {row.status === "RENTED_OUT" && <AppointmentForm caseId={row.id} kind="RETURN" busy={busy} save={save} />}
    {row.status === "RETURN_SCHEDULED" && active("RETURN") && <ReturnForm caseId={row.id} busy={busy} save={save} />}
    {row.status === "RETURNED" && <AppointmentForm caseId={row.id} kind="BACK_TO_SELLER" busy={busy} save={save} />}
    {(row.status === "IN_CUSTODY" || row.status === "PICKUP_SCHEDULED") && <>
      <button type="button" className="btn btn-secondary self-start" disabled={busy} onClick={() => { if (window.confirm("¿Coordinar la devolución del objeto al vendedor y cancelar el trato? El artículo seguirá reservado hasta el retorno físico.")) setReturning(true); }}>Devolver al vendedor</button>
      {returning && <AppointmentForm caseId={row.id} kind="BACK_TO_SELLER" busy={busy} save={save} />}
    </>}
    {row.status === "BACK_TO_SELLER" && active("BACK_TO_SELLER") && <button type="button" disabled={busy} className="btn btn-primary self-start"
      onClick={() => { if (window.confirm("¿Confirmas que el vendedor ya recibió físicamente su objeto?")) void save(`/staff/cases/${row.id}/back-to-seller`); }}>Confirmar retorno al vendedor</button>}
  </div>;
}
