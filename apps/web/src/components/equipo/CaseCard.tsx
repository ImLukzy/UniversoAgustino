import { PrivateImage } from "../PrivateImage";
import { CaseFulfillment } from "./CaseFulfillment";
import { beforeCustody, isCaseOpen, type AppointmentKind } from "@hub/shared";
import { CaseChat } from "../orders/CaseChat";
import { pen, resolveQr } from "../../lib/api";
import { CaseAssignment } from "./CaseAssignment";
import { AppointmentForm } from "./AppointmentForm";
import { ReceiveForm } from "./ReceiveForm";
import { CASE_LABELS, appointmentLabel, caseTime, type StaffCase, type CaseSave } from "./caseTypes";

export function CaseCard({ row, userId, admin, busy, save }: { row: StaffCase; userId: string; admin: boolean; busy: boolean; save: CaseSave }) {
  const manage = admin || row.assigneeId === userId;
  const phaseKind = ({ ASSIGNED: "DROP_OFF", DROP_SCHEDULED: "DROP_OFF", PICKUP_SCHEDULED: "PICKUP", RETURN_SCHEDULED: "RETURN", BACK_TO_SELLER: "BACK_TO_SELLER" } as Record<string, AppointmentKind>)[row.status];
  const noShow = [...row.appointments].reverse().find((a) => a.status === "NO_SHOW" && a.kind === phaseKind);
  const reprogram = noShow && !row.appointments.some((a) => a.kind === noShow.kind && a.rescheduledFromId);
  const scheduled = row.appointments.find((a) => a.kind === "DROP_OFF" && a.status === "SCHEDULED");
  const now = Date.now(), receiving = scheduled && now >= new Date(scheduled.startsAt).getTime() && now <= new Date(scheduled.endsAt).getTime();
  return <article className="card flex min-w-0 flex-col gap-4 p-5">
    <header className="flex min-w-0 flex-wrap justify-between gap-2"><h2 className="min-w-0 break-words font-bold">{row.order.itemTitle}</h2><span className="tag whitespace-normal">{CASE_LABELS[row.status]}</span></header>
    <p className="break-words text-sm">{row.order.rentalStart ? "Alquiler" : "Venta"} · {pen(row.order.amountCents)} · {row.assignee?.profile?.fullName ?? "Sin custodio"}</p>
    {beforeCustody(row.status) && <CaseAssignment row={row} admin={admin} busy={busy} save={save} />}
    {row.appointments.map((a) => <div key={a.id} className="flex min-w-0 flex-col gap-1 rounded-lg border p-3 text-sm">
      <p className="break-words">{appointmentLabel(a.kind)} · {caseTime(a.startsAt)} · {a.status === "SCHEDULED" ? "Programada" : a.status === "DONE" ? "Completada" : a.status === "NO_SHOW" ? "Ausencia" : "Cancelada"}</p>
      <p className="break-words">{a.sede.name} · {a.sede.address} · {a.sede.meetingPoint}</p>
      {manage && a.status === "SCHEDULED" && new Date(a.endsAt).getTime() <= now && <button type="button" disabled={busy} className="btn btn-secondary btn-sm self-start"
        onClick={() => { if (window.confirm("¿Confirmas que la persona no asistió?")) void save(`/staff/cases/${row.id}/appointments/${a.id}/no-show`); }}>Registrar ausencia</button>}
    </div>)}
    {row.receivedPhotoUrl && <img src={resolveQr(row.receivedPhotoUrl) ?? undefined} alt="Objeto recibido por el equipo" className="h-40 w-full rounded-xl object-contain" />}
    {row.conditionNote && <p className="break-words text-sm">{row.conditionNote}</p>}
    {manage && row.status === "ASSIGNED" && !noShow && <AppointmentForm caseId={row.id} kind="DROP_OFF" busy={busy} save={save} />}
    {row.assigneeId === userId && row.status === "DROP_SCHEDULED" && receiving && <ReceiveForm caseId={row.id} busy={busy} save={save} />}
    {manage && row.status === "IN_CUSTODY" && <AppointmentForm caseId={row.id} kind="PICKUP" busy={busy} save={save} />}
    {manage && reprogram && phaseKind && <AppointmentForm caseId={row.id} kind={noShow.kind as AppointmentKind} previousId={noShow.id} busy={busy} save={save} />}
    {manage && noShow && !reprogram && <p className="text-sm">La reprogramación de este tipo ya fue usada. Solicita revisión al Técnico.</p>}
    {row.paymentRef && <p className="break-words text-sm">Pago registrado: {row.paymentMethod === "CASH" ? "Efectivo" : row.paymentRef} · Recibido por el equipo</p>}
    {row.order.payProofUrl && <PrivateImage path={row.order.payProofUrl} alt="Comprobante del cobro en sede" expandable />}
    {row.returnConditionNote && <p className="break-words text-sm">Devolución: {row.returnCondition === "OK" ? "Conforme" : "Con observaciones"} · {row.returnConditionNote}</p>}
    {row.returnPhotoUrl && <img src={resolveQr(row.returnPhotoUrl) ?? undefined} alt="Objeto revisado al devolver" className="h-40 w-full rounded-xl object-contain" />}
    {manage && <CaseFulfillment row={row} busy={busy} save={save} />}
    {manage && beforeCustody(row.status) && <button type="button" disabled={busy} className="btn btn-secondary self-start"
      onClick={() => { if (window.confirm("¿Cancelar el trato antes de recibir el objeto? Se avisará a comprador y vendedor.")) void save(`/staff/cases/${row.id}/cancel`); }}>Cancelar trato</button>}
    {(manage || admin) && <CaseChat caseId={row.id} base="/staff/cases" closed={!isCaseOpen(row.status)} />}
    {row.status === "PICKUP_SCHEDULED" && <p className="text-sm">Cobro al equipo en sede antes de entregar; liquidación al vendedor en 24–48 h.</p>}
  </article>;
}
