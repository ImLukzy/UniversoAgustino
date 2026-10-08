import { z } from "zod";

const minute = z.number().int().min(0).max(1440);
const weekday = z.number().int().min(0).max(6);
export const SedeSchema = z.object({
  name: z.string().trim().min(1).max(100), address: z.string().trim().max(300).default(""),
  meetingPoint: z.string().trim().max(300).default(""), active: z.boolean().default(true),
  photoUrl: z.string().regex(/^\/uploads\/[A-Za-z0-9_-][A-Za-z0-9._-]{0,199}$/).nullable().optional(),
});
export const HoursSchema = z.object({ opens: minute, closes: minute, special: z.boolean().default(false) })
  .refine((v) => v.opens < v.closes, { message: "El cierre debe ser posterior a la apertura", path: ["closes"] });
export const WeekdaySchema = z.coerce.number().int().min(0).max(6);
export const HolidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((v) => {
    const d = new Date(`${v}T00:00:00Z`); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, "Fecha inválida"), reason: z.string().trim().min(3).max(200),
});
export const ShiftSchema = z.object({
  userId: z.string().min(1), sedeId: z.string().min(1), weekday, startsMin: minute, endsMin: minute,
}).refine((v) => v.startsMin < v.endsMin, { message: "El fin debe ser posterior al inicio", path: ["endsMin"] });
export const intervalsOverlap = (a: { startsMin: number; endsMin: number }, b: { startsMin: number; endsMin: number }) =>
  a.startsMin < b.endsMin && a.endsMin > b.startsMin;
