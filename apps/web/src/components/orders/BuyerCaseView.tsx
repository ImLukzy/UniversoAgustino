import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthContext";
import { api, apiError, pen, resolveQr } from "../../lib/api";
import { CASE_LABELS, appointmentLabel, caseTime, type CaseSede, type CaseAppointment } from "../equipo/caseTypes";
import type { CaseStatus } from "@hub/shared";

type ParticipantCase = { status: CaseStatus; staffName: string; amountCents: number; sede: CaseSede | null;
  receivedPhotoUrl: string | null; conditionNote: string | null; appointments: CaseAppointment[] };
export function BuyerCaseView({ orderId }: { orderId: string }) {
  const { user } = useAuth();
  const query = useQuery({ refetchInterval: 30_000, queryKey: ["case", orderId, user?.id], queryFn: async () => (await api.get(`/cases/order/${orderId}`)).data.data as ParticipantCase | null });
  if (query.isPending) return <p role="status" className="min-h-16 text-sm">Cargando coordinación…</p>;
  if (query.error) return <p role="alert" className="break-words text-sm">{apiError(query.error)}</p>;
  const row = query.data;
  return <section className="flex min-w-0 flex-col gap-2 rounded-xl bg-primary-soft p-3 text-sm">
    <p className="font-bold">{row ? CASE_LABELS[row.status] : "Coordinación pendiente"}</p>
    <p>Pagas al vendedor al recoger delante del equipo.</p>
    {row && <><p className="break-words">{row.staffName} · {pen(row.amountCents)}</p>
      {row.appointments.map((a) => <div key={a.id} className="min-w-0 break-words"><p>{appointmentLabel(a.kind)} · {caseTime(a.startsAt)} (Lima) · {a.status === "SCHEDULED" ? "Programada" : a.status === "NO_SHOW" ? "Ausencia" : a.status === "DONE" ? "Completada" : "Cancelada"}</p>
        <p>{a.sede.name} · {a.sede.address} · {a.sede.meetingPoint}</p></div>)}
      {row.receivedPhotoUrl && <img src={resolveQr(row.receivedPhotoUrl) ?? undefined} alt="Estado del objeto recibido" className="h-36 w-full rounded-lg object-contain" />}
      {row.conditionNote && <p className="break-words">{row.conditionNote}</p>}</>}
  </section>;
}
