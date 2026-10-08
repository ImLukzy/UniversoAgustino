import { z } from "zod";

const DAY_MS = 86_400_000;
export const AGENDA_DAYS = 6; // lunes–sábado
export const AgendaQuerySchema = z.object({
  week: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()), "Fecha inválida").optional(),
  sedeId: z.string().min(1).optional(),
  staffId: z.string().min(1).optional(),
});
// Lunes (YYYY-MM-DD) de la semana de cualquier fecha YYYY-MM-DD.
export function mondayOf(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  return new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY_MS).toISOString().slice(0, 10);
}
export const addDays = (day: string, n: number) => new Date(new Date(`${day}T00:00:00Z`).getTime() + n * DAY_MS).toISOString().slice(0, 10);
// Lunes a sábado de la semana que contiene `day`.
export const weekDays = (day: string) => Array.from({ length: AGENDA_DAYS }, (_, i) => addDays(mondayOf(day), i));
