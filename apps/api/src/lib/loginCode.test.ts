import { describe, expect, it } from "vitest";
import { LOGIN_CODE_MAX_ATTEMPTS, checkLoginCode, hashLoginCode, newLoginCode } from "./loginCode.js";

const secret = "s".repeat(32);
const email = "rosa.quispe@unsa.edu.pe";
const now = new Date("2026-09-27T10:00:00Z");
const row = (code: string, over: Partial<{ attempts: number; expiresAt: Date; usedAt: Date | null }> = {}) => ({
  codeHash: hashLoginCode(secret, email, code),
  attempts: 0,
  expiresAt: new Date(now.getTime() + 60_000),
  usedAt: null,
  ...over,
});

describe("códigos de ingreso por correo", () => {
  it("genera 6 dígitos", () => {
    for (let i = 0; i < 50; i++) expect(newLoginCode()).toMatch(/^\d{6}$/);
  });

  it("acepta el código correcto y rechaza otro código u otro correo", () => {
    expect(checkLoginCode(row("123456"), { secret, email, code: "123456", now })).toBe("OK");
    expect(checkLoginCode(row("123456"), { secret, email: " ROSA.QUISPE@unsa.edu.pe", code: "123456", now })).toBe("OK");
    expect(checkLoginCode(row("123456"), { secret, email, code: "123457", now })).toBe("INCORRECTO");
    expect(checkLoginCode(row("123456"), { secret, email: "otra@unsa.edu.pe", code: "123456", now })).toBe("INCORRECTO");
  });

  it("vencido, usado, inexistente o sin intentos no sirve", () => {
    expect(checkLoginCode(null, { secret, email, code: "123456", now })).toBe("VENCIDO");
    expect(checkLoginCode(row("123456", { expiresAt: now }), { secret, email, code: "123456", now })).toBe("VENCIDO");
    expect(checkLoginCode(row("123456", { usedAt: now }), { secret, email, code: "123456", now })).toBe("VENCIDO");
    expect(checkLoginCode(row("123456", { attempts: LOGIN_CODE_MAX_ATTEMPTS }), { secret, email, code: "123456", now })).toBe("INTENTOS");
  });
});
