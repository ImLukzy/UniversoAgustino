import { describe, expect, it } from "vitest";
import { CaseMessageSchema, isCaseOpen } from "./chat.js";

describe("chat del caso", () => {
  it("recorta espacios y exige contenido", () => {
    expect(CaseMessageSchema.parse({ body: "  hola  " }).body).toBe("hola");
    expect(CaseMessageSchema.safeParse({ body: "   " }).success).toBe(false);
  });
  it("rechaza más de 1000 caracteres", () => {
    expect(CaseMessageSchema.safeParse({ body: "a".repeat(1001) }).success).toBe(false);
    expect(CaseMessageSchema.safeParse({ body: "a".repeat(1000) }).success).toBe(true);
  });
  it("cerrado o cancelado no admite mensajes", () => {
    expect(isCaseOpen("CLOSED")).toBe(false);
    expect(isCaseOpen("CANCELLED")).toBe(false);
    expect(isCaseOpen("IN_CUSTODY")).toBe(true);
  });
});
