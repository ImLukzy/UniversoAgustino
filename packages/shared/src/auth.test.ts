import { describe, expect, it } from "vitest";
import { ForgotSchema, ResetSchema, simulateEarnings } from "./index.js";

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
