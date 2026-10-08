import { beforeCustody } from "@hub/shared";
import { pen, resolveQr } from "../../lib/api";
import { CaseAssignment } from "./CaseAssignment";
import { AppointmentForm } from "./AppointmentForm";
import { ReceiveForm } from "./ReceiveForm";
import { CASE_LABELS, appointmentLabel, caseTime, type StaffCase, type CaseSave } from "./caseTypes";

export function CaseCard({ row, userId, admin, busy, save }: { row: StaffCase; userId: string; admin: boolean; busy: boolean; save: CaseSave }) {
  const manage = admin || row.assigneeId === userId;
  const noShow = [...row.appointments].reverse().find((a) => a.status === "NO_SHOW" && (a.kind === "DROP_OFF" || a.kind === "PICKUP"));
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
    {manage && reprogram && (row.status === "ASSIGNED" || row.status === "DROP_SCHEDULED" || row.status === "PICKUP_SCHEDULED") && <AppointmentForm caseId={row.id} kind={noShow.kind as "DROP_OFF" | "PICKUP"} previousId={noShow.id} busy={busy} save={save} />}
    {manage && noShow && !reprogram && <p className="text-sm">La reprogramación de este tipo ya fue usada. Solicita revisión al Técnico.</p>}
    {manage && beforeCustody(row.status) && <button type="button" disabled={busy} className="btn btn-secondary self-start"
      onClick={() => { if (window.confirm("¿Cancelar el trato antes de recibir el objeto? Se avisará a comprador y vendedor.")) void save(`/staff/cases/${row.id}/cancel`); }}>Cancelar trato</button>}
    {row.status === "PICKUP_SCHEDULED" && <p className="text-sm">Pago al vendedor delante del equipo al recoger.</p>}
  </article>;
}
