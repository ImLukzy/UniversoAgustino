export type AgendaDay = { date: string; weekday: number; open: boolean; opens: number | null; closes: number | null; holiday: string | null };
export type AgendaAppt = { id: string; caseId: string; kind: string; status: string; startsAt: string; endsAt: string;
  sede: { id: string; name: string }; staff: { id: string; name: string }; party: string; itemTitle: string };
export type AgendaShift = { userId: string; sedeId: string; weekday: number; startsMin: number; endsMin: number };
export type Agenda = { weekStart: string; days: AgendaDay[]; staff: { id: string; name: string }[]; shifts: AgendaShift[]; appointments: AgendaAppt[] };

const LIMA_MS = 5 * 3_600_000;
export const limaMinute = (iso: string) => { const d = new Date(new Date(iso).getTime() - LIMA_MS); return d.getUTCHours() * 60 + d.getUTCMinutes(); };
export const limaDate = (iso: string) => new Date(new Date(iso).getTime() - LIMA_MS).toISOString().slice(0, 10);
export const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
export const KIND_LABEL: Record<string, string> = { DROP_OFF: "Recepción", PICKUP: "Recojo", RETURN: "Devolución", BACK_TO_SELLER: "Retorno" };
export const STATUS_LABEL: Record<string, string> = { SCHEDULED: "Programada", DONE: "Completada", NO_SHOW: "Ausencia", CANCELLED: "Cancelada" };
export const STATUS_CLASS: Record<string, string> = { SCHEDULED: "border-primary bg-white", DONE: "border-zinc-400 bg-zinc-100", NO_SHOW: "border-[#b91c1c] bg-white", CANCELLED: "border-zinc-300 bg-white text-zinc-500 line-through" };
export const dayName = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString("es-PE", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" });
