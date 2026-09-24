import crypto from "node:crypto";

// Spec 22: códigos de ingreso por correo (puros, testeables). Se guarda solo
// el HMAC ligado al email: una fila filtrada no sirve para otro correo ni
// permite recuperar el código sin el secreto.
export const LOGIN_CODE_TTL_MS = 10 * 60_000;
export const LOGIN_CODE_RESEND_MS = 60_000;
export const LOGIN_CODE_MAX_ATTEMPTS = 5;

export const newLoginCode = (): string => crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");

export const hashLoginCode = (secret: string, email: string, code: string): string =>
  crypto.createHmac("sha256", secret).update(`${email.trim().toLowerCase()}:${code}`).digest("hex");

export function matchesLoginCode(secret: string, email: string, code: string, storedHash: string): boolean {
  const a = Buffer.from(hashLoginCode(secret, email, code), "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export type CodeCheck = "OK" | "VENCIDO" | "INTENTOS" | "INCORRECTO";

// Decide el resultado de un intento sobre el código vivo más reciente.
export function checkLoginCode(
  row: { codeHash: string; attempts: number; expiresAt: Date; usedAt: Date | null } | null,
  input: { secret: string; email: string; code: string; now: Date },
): CodeCheck {
  if (!row || row.usedAt || row.expiresAt <= input.now) return "VENCIDO";
  if (row.attempts >= LOGIN_CODE_MAX_ATTEMPTS) return "INTENTOS";
  return matchesLoginCode(input.secret, input.email, input.code, row.codeHash) ? "OK" : "INCORRECTO";
}
