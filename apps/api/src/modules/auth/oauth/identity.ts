import { ALLOWED_EMAIL_EXCEPTIONS, UNSA_EMAIL_DOMAIN } from "@hub/shared";

export interface GoogleProfile {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  hd?: string;
  name?: string;
  picture?: string;
}

export type GoogleIdentity = { ok: true; sub: string; email: string; fullName: string; avatarUrl: string | null } | { ok: false; code: "EMAIL_NO_VERIFICADO" | "EMAIL_NO_AUTORIZADO"; email: string };

// Puerta institucional de Google (pura, testeable): correo verificado por
// Google, dominio exacto @unsa.edu.pe y cuenta administrada por el Workspace
// de la UNSA (claim `hd`). Un Gmail personal que registró un alias
// @unsa.edu.pe no trae `hd` y se rechaza. Única salvedad: la lista de
// excepciones autorizadas de @hub/shared.
export function checkGoogleIdentity(me: GoogleProfile): GoogleIdentity {
  const email = String(me.email ?? "").trim().toLowerCase();
  if (!email || !me.sub || me.email_verified !== true) return { ok: false, code: "EMAIL_NO_VERIFICADO", email };
  const excepted = (ALLOWED_EMAIL_EXCEPTIONS as string[]).includes(email);
  const institutional = email.endsWith(`@${UNSA_EMAIL_DOMAIN}`) && String(me.hd ?? "").toLowerCase() === UNSA_EMAIL_DOMAIN;
  if (!excepted && !institutional) return { ok: false, code: "EMAIL_NO_AUTORIZADO", email };
  const fullName = String(me.name ?? "").trim() || email.split("@")[0];
  return { ok: true, sub: String(me.sub), email, fullName, avatarUrl: typeof me.picture === "string" ? me.picture : null };
}
