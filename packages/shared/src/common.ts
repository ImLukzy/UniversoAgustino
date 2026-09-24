import { z } from "zod";

export const UniversitySchema = z.enum(["UNSA"]);
export type University = z.infer<typeof UniversitySchema>;

// --- Comunidad UNSA: solo correos institucionales + excepción autorizada ---
export const UNSA_EMAIL_DOMAIN = "unsa.edu.pe";
export const ALLOWED_EMAIL_EXCEPTIONS = ["lukas.melgar@tecsup.edu.pe"];

export function isAllowedEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  if ((ALLOWED_EMAIL_EXCEPTIONS as string[]).includes(e)) return true;
  return e.endsWith(`@${UNSA_EMAIL_DOMAIN}`);
}

export const UnsaEmailSchema = z
  .string()
  .email()
  .max(160)
  .refine((v) => isAllowedEmail(v), {
    message: "Acceso exclusivo comunidad UNSA: usa tu correo @unsa.edu.pe",
  });

// --- Carreras UNSA (Escuelas Profesionales). El catálogo visual
// (etiquetas, facultad, color) vive en apps/web/src/data/unsa.ts y debe
// mantener las mismas claves que CareerSchema. ---
export const CareerSchema = z.enum([
  "ENFERMERIA",
  "MEDICINA",
  "PSICOLOGIA",
  "BIOLOGIA",
  "DERECHO",
  "EDUCACION",
  "ADMINISTRACION",
  "CONTABILIDAD",
  "ECONOMIA",
  "ING_SISTEMAS",
  "ING_CIVIL",
  "ING_INDUSTRIAL",
  "ARQUITECTURA",
  "AGRONOMIA",
  "ING_MECANICA",
  "ING_QUIMICA",
  "ING_MINAS",
  "TURISMO",
  "COMUNICACION",
  "OTRA_UNSA",
]);
export type Career = z.infer<typeof CareerSchema>;

export const RoleSchema = z.enum(["student", "creator", "moderator", "admin"]);
export type Role = z.infer<typeof RoleSchema>;

export const PEN = (cents: number) => `S/ ${(cents / 100).toFixed(2)}`;
