import { z } from "zod";
export const PrivatePhotoSchema = z.string().regex(/^\/uploads\/[A-Za-z0-9_-][A-Za-z0-9._-]{0,199}$/);
export const PaymentAccountSchema = z.object({
  userId: z.string().min(1), method: z.enum(["YAPE", "PLIN", "OTHER"]),
  holder: z.string().trim().min(3).max(120), number: z.string().trim().min(3).max(80),
  photoUrl: PrivatePhotoSchema, qrUrl: PrivatePhotoSchema, active: z.boolean().default(true),
}).strict();
export const PaymentAccountUpdateSchema = PaymentAccountSchema.omit({ userId: true });
export type PaymentAccountInput = z.infer<typeof PaymentAccountSchema>;
