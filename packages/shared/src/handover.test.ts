import { describe, expect, it } from "vitest";
import { AppointmentSchema, ReceiveSchema, beforeCustody, canTransitionCase, PickupSchema, ReturnReviewSchema } from "./handover.js";
describe("contratos de custodia", () => {
  it.each(["UNASSIGNED", "ASSIGNED", "DROP_SCHEDULED"] as const)("%s permite cancelación previa", (status) => expect(beforeCustody(status)).toBe(true));
  it.each(["IN_CUSTODY", "PICKUP_SCHEDULED", "CLOSED"] as const)("%s no libera custodia", (status) => expect(beforeCustody(status)).toBe(false));
  it("no permite saltar recepción", () => { expect(canTransitionCase("ASSIGNED", "PICKUP_SCHEDULED")).toBe(false); expect(canTransitionCase("DROP_SCHEDULED", "IN_CUSTODY")).toBe(true); });
  it.each(["RETURN", "BACK_TO_SELLER"])("31b permite %s", (kind) => expect(AppointmentSchema.safeParse({ kind, sedeId: "s", startsAt: "2026-10-09T13:00:00Z" }).success).toBe(true));
  it.each(["https://example.test/foto.png", "/uploads/../secret", "/uploads/"])("rechaza foto externa o ruta %s", (photoUrl) => expect(ReceiveSchema.safeParse({ photoUrl, conditionNote: "Buen estado" }).success).toBe(false));
  it("exige nota y acepta imagen interna", () => { expect(ReceiveSchema.safeParse({ photoUrl: "/uploads/foto.png", conditionNote: " " }).success).toBe(false); expect(ReceiveSchema.parse({ photoUrl: "/uploads/foto.png", conditionNote: "  Buen estado  " }).conditionNote).toBe("Buen estado"); });
});

describe("certificación física", () => {
  it.each([{}, { paymentMethod: "CASH", paymentConfirmed: false }, { paymentMethod: "OPERATION", paymentConfirmed: true }, { paymentMethod: "OPERATION", paymentRef: "1", paymentConfirmed: true }])("pago insuficiente %j no entrega", (body) => expect(PickupSchema.safeParse(body).success).toBe(false));
  it("efectivo requiere confirmación y operación se normaliza", () => { expect(PickupSchema.parse({ paymentMethod: "CASH", paymentConfirmed: true }).paymentMethod).toBe("CASH"); expect(PickupSchema.parse({ paymentMethod: "OPERATION", paymentRef: "  12345  ", paymentConfirmed: true }).paymentRef).toBe("12345"); });
  it("no registra devolución sin revisión explícita", () => { expect(ReturnReviewSchema.safeParse({ condition: "OK", conditionNote: "Buen estado" }).success).toBe(false); expect(ReturnReviewSchema.safeParse({ condition: "OK", conditionNote: "Buen estado", reviewConfirmed: true }).success).toBe(true); });
});
