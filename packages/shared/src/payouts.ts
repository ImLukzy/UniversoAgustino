import { z } from "zod";
export const CompletePayoutSchema = z.object({
  proofUrl: z.string().regex(/^\/uploads\/[A-Za-z0-9_-][A-Za-z0-9._-]{0,199}$/),
  paymentRef: z.string().trim().min(3).max(160).optional(),
}).strict();
export const ResumePayoutSchema = z.object({ reason: z.string().trim().min(5).max(300) }).strict();
export const PayoutListSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "FROZEN"]).default("PENDING"),
  page: z.coerce.number().int().min(1).max(100000).default(1),
});
export const EarningsPeriodSchema = z.object({
  from: z.string().datetime({ offset: true }), to: z.string().datetime({ offset: true }),
}).refine((v) => new Date(v.from) < new Date(v.to) && new Date(v.to).getTime() - new Date(v.from).getTime() <= 366 * 86400000,
  { message: "Selecciona un periodo válido de hasta366 días" });
export type PayoutListInput = z.infer<typeof PayoutListSchema>;
