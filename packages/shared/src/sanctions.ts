import { z } from "zod";

export const STRIKE_WINDOW_DAYS = 90;
export const STRIKE_LIMIT = 3;
export const AUTO_SUSPENSION_DAYS = 14;
export const SanctionKindSchema = z.enum(["WARNING", "SUSPENSION", "BAN"]);
export type SanctionKind = z.infer<typeof SanctionKindSchema>;

export const ReviewInputSchema = z.object({
  score: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).default(""),
  caseId: z.string().min(1).optional(),
});
// SUSPENSION exige días (1–30); WARNING y BAN no llevan duración.
export const SanctionInputSchema = z.object({
  kind: SanctionKindSchema,
  reason: z.string().trim().min(5).max(300),
  days: z.number().int().min(1).max(30).optional(),
}).refine((v) => (v.kind === "SUSPENSION") === (v.days !== undefined), { message: "Solo la suspensión lleva días (1–30)", path: ["days"] });
export const LiftSchema = z.object({ reason: z.string().trim().min(5).max(300) });

// 3 faltas vigentes dentro de 90 días activan la suspensión automática.
export const shouldAutoSuspend = (activeStrikes: number) => activeStrikes >= STRIKE_LIMIT;
// Trabajador (moderator) solo advierte; Técnico (admin) aplica todo.
export const canApplySanction = (role: string, kind: SanctionKind) => role === "admin" || (role === "moderator" && kind === "WARNING");
export const isBlocking = (s: { kind: SanctionKind; liftedAt: Date | string | null; endsAt: Date | string | null }, now = new Date()) =>
  s.kind !== "WARNING" && !s.liftedAt && (!s.endsAt || new Date(s.endsAt) > now);
