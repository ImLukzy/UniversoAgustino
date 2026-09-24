import { z } from "zod";
import { CareerSchema, UniversitySchema, UnsaEmailSchema } from "./common.js";

// --- Auth (comunidad UNSA) ---
export const RegisterSchema = z.object({
  email: UnsaEmailSchema,
  password: z.string().min(8).max(100),
  fullName: z.string().min(2).max(120),
  university: UniversitySchema.default("UNSA"),
  career: CareerSchema.default("ENFERMERIA"),
  cycle: z.string().max(20).optional(),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: UnsaEmailSchema,
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginSchema>;

// Sprint F1-01: recuperación de contraseña (el backend nunca confirma si el
// email existe: misma respuesta 202 en ambos casos).
export const ForgotSchema = z.object({
  email: z.string().email().max(160),
});
export type ForgotInput = z.infer<typeof ForgotSchema>;

export const ResetSchema = z.object({
  token: z.string().min(32).max(128),
  password: z
    .string()
    .min(10)
    .max(128)
    .regex(/[a-z]/, "Debe incluir minúscula")
    .regex(/[A-Z]/, "Debe incluir mayúscula")
    .regex(/[0-9]/, "Debe incluir número"),
});
export type ResetInput = z.infer<typeof ResetSchema>;

// Edición del perfil propio (Mi cuenta).
export const UpdateProfileSchema = z.object({
  fullName: z.string().min(2).max(120),
  career: CareerSchema,
  cycle: z.string().max(20).optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

// Ingreso con correo institucional (spec 22): el backend envía un código de
// 6 dígitos al buzón. Canjearlo prueba que la cuenta @unsa.edu.pe existe,
// está activa y es de quien la escribe (un correo inventado no recibe nada).
const NormalizedUnsaEmail = z.preprocess((v) => (typeof v === "string" ? v.trim().toLowerCase() : v), UnsaEmailSchema);

export const EmailStartSchema = z.object({ email: NormalizedUnsaEmail });
export type EmailStartInput = z.infer<typeof EmailStartSchema>;

export const EmailVerifySchema = z.object({
  email: NormalizedUnsaEmail,
  code: z.preprocess((v) => (typeof v === "string" ? v.replace(/\s/g, "") : v), z.string().regex(/^\d{6}$/, "El código tiene 6 dígitos")),
});
export type EmailVerifyInput = z.infer<typeof EmailVerifySchema>;
