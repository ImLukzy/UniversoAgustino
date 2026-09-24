import { describe, expect, it } from "vitest";
import { EmailStartSchema, EmailVerifySchema, ForgotSchema, ResetSchema, isAllowedEmail, simulateEarnings } from "./index.js";

describe("isAllowedEmail (puerta OAuth y registro)", () => {
  it("permite @unsa.edu.pe sin importar mayúsculas ni espacios", () => {
    expect(isAllowedEmail("Rosa.Quispe@UNSA.edu.pe ")).toBe(true);
    expect(isAllowedEmail("a@unsa.edu.pe")).toBe(true);
  });

  it("permite la excepción única tecsup (case-insensitive)", () => {
    expect(isAllowedEmail("Lukas.melgar@tecsup.edu.pe")).toBe(true);
    expect(isAllowedEmail("LUKAS.MELGAR@TECSUP.EDU.PE")).toBe(true);
  });

  it("bloquea gmail, hotmail, subdominios falsos y parecidos", () => {
    expect(isAllowedEmail("alguien@gmail.com")).toBe(false);
    expect(isAllowedEmail("alguien@hotmail.com")).toBe(false);
    expect(isAllowedEmail("a@unsa.edu.pe.evil.com")).toBe(false);
    expect(isAllowedEmail("a@notunsa.edu.pe")).toBe(false);
    expect(isAllowedEmail("a@unsa.edu.pe ")).toBe(true);
    expect(isAllowedEmail("")).toBe(false);
  });
});

describe("ForgotSchema", () => {
  it("acepta un email válido", () => {
    expect(ForgotSchema.safeParse({ email: "rosa.quispe@unsa.edu.pe" }).success).toBe(true);
  });

  it("rechaza email inválido", () => {
    expect(ForgotSchema.safeParse({ email: "no-es-email" }).success).toBe(false);
  });
});

describe("ResetSchema", () => {
  const token = "a".repeat(32);

  it("acepta contraseña fuerte", () => {
    expect(ResetSchema.safeParse({ token, password: "Temporal123!" }).success).toBe(true);
  });

  it("rechaza débil y por regla faltante", () => {
    expect(ResetSchema.safeParse({ token, password: "corta" }).success).toBe(false);
    expect(ResetSchema.safeParse({ token, password: "sinmayuscula123" }).success).toBe(false);
    expect(ResetSchema.safeParse({ token, password: "SINMINUSCULA123" }).success).toBe(false);
    expect(ResetSchema.safeParse({ token, password: "SinNumeros!!" }).success).toBe(false);
  });

  it("rechaza token corto", () => {
    expect(ResetSchema.safeParse({ token: "corto", password: "Temporal123!" }).success).toBe(false);
  });
});

describe("simulateEarnings", () => {
  it("calcula bruto, fee 13% y neto", () => {
    const r = simulateEarnings({ avgPrice: 10, salesPerMonth: 10, bazarExtra: 0, feePct: 13 });
    expect(r.gross).toBe(100);
    expect(r.fee).toBe(13);
    expect(r.net).toBe(87);
  });
});

describe("EmailStartSchema / EmailVerifySchema (ingreso con código)", () => {
  it("normaliza y acepta @unsa.edu.pe", () => {
    const r = EmailStartSchema.safeParse({ email: "  Rosa.Quispe@UNSA.edu.pe " });
    expect(r.success && r.data.email).toBe("rosa.quispe@unsa.edu.pe");
  });

  it("acepta la excepción autorizada (tecsup) y nada más de ese dominio", () => {
    const r = EmailStartSchema.safeParse({ email: " Lukas.Melgar@TECSUP.edu.pe " });
    expect(r.success && r.data.email).toBe("lukas.melgar@tecsup.edu.pe");
    expect(EmailStartSchema.safeParse({ email: "otro@tecsup.edu.pe" }).success).toBe(false);
  });

  it("rechaza correos externos o con dominio parecido", () => {
    for (const email of ["rosa@gmail.com", "rosa@unsa.edu.pe.evil.com", "rosa@notunsa.edu.pe", "rosa@unsa.edu", "unsa.edu.pe"]) {
      expect(EmailStartSchema.safeParse({ email }).success).toBe(false);
    }
  });

  it("exige código de 6 dígitos (tolera espacios)", () => {
    expect(EmailVerifySchema.safeParse({ email: "a@unsa.edu.pe", code: "123 456" }).success).toBe(true);
    expect(EmailVerifySchema.safeParse({ email: "a@unsa.edu.pe", code: "12345" }).success).toBe(false);
    expect(EmailVerifySchema.safeParse({ email: "a@unsa.edu.pe", code: "abcdef" }).success).toBe(false);
  });
});
