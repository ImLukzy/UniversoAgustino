import { EmailStartSchema, UNSA_EMAIL_DOMAIN } from "@hub/shared";

// Spec 22: el alumno puede escribir solo su usuario ("rquispe") y se completa
// el dominio institucional. La validación final es la misma del backend.
export function completeUnsaEmail(raw: string): string {
  const v = raw.trim().toLowerCase();
  return v && !v.includes("@") ? `${v}@${UNSA_EMAIL_DOMAIN}` : v;
}

export function unsaEmailError(raw: string): string | null {
  if (!raw.trim()) return "Escribe tu correo institucional";
  return EmailStartSchema.safeParse({ email: completeUnsaEmail(raw) }).success ? null : "Usa tu correo @unsa.edu.pe";
}

export const onlyDigits = (v: string, max = 6) => v.replace(/\D/g, "").slice(0, max);
