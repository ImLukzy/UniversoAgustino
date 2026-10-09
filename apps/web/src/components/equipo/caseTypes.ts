import type { CaseStatus } from "@hub/shared";
export type CaseSede = { id: string; name: string; address: string; meetingPoint: string };
export type CaseAppointment = { id: string; kind: string; startsAt: string; endsAt: string; status: string; rescheduledFromId?: string | null; sede: CaseSede };
export type StaffCase = { id: string; status: CaseStatus; assigneeId: string | null; receivedPhotoUrl: string | null;
  conditionNote: string | null; returnCondition: string | null; returnConditionNote: string | null; returnPhotoUrl: string | null;
  paymentRef: string | null; paymentMethod: string | null; sellerConfirmedAt: string | null; assignee: { id: string; profile: { fullName: string } | null } | null;
  order: { payProofUrl?: string | null; verifiedAt?: string | null; itemTitle: string; amountCents: number; rentalStart: string | null; rentalEnd: string | null }; sede: CaseSede | null; appointments: CaseAppointment[] };
export type CaseSave = (path: string, body?: unknown) => Promise<boolean>;
export const CASE_LABELS: Record<CaseStatus, string> = {
  UNASSIGNED: "Sin asignar", ASSIGNED: "Custodio asignado", DROP_SCHEDULED: "Entrega programada", IN_CUSTODY: "En custodia",
  PICKUP_SCHEDULED: "Recojo programado", DELIVERED: "Entregado", RENTED_OUT: "En alquiler", RETURN_SCHEDULED: "Devolución programada",
  RETURNED: "Devuelto al equipo", BACK_TO_SELLER: "Retorno al vendedor", CLOSED: "Cerrado", CANCELLED: "Cancelado",
};
export const appointmentLabel = (kind: string) => ({ DROP_OFF: "Entrega al equipo", PICKUP: "Recojo", RETURN: "Devolución", BACK_TO_SELLER: "Retorno al vendedor" })[kind] ?? kind;
export const caseTime = (date: string) => new Date(date).toLocaleString("es-PE", { timeZone: "America/Lima", dateStyle: "short", timeStyle: "short" });
