import { describe, expect, it } from "vitest";
import {
  CANCEL_REASON_LABEL,
  ORDER_STATUS,
  ORDER_TRANSITIONS,
  canTransition,
  cancelLabel,
  isCancelReason,
} from "./index.js";

describe("ORDER_STATUS", () => {
  it("contiene los 7 estados del enum de Prisma", () => {
    expect([...ORDER_STATUS].sort()).toEqual(
      ["ACCEPTED", "CANCELLED", "ESCROW", "PAID", "PENDING", "REFUNDED", "RELEASED"].sort(),
    );
  });

  it("toda transición listada existe como estado", () => {
    for (const [from, tos] of Object.entries(ORDER_TRANSITIONS)) {
      expect(ORDER_STATUS).toContain(from);
      for (const to of tos as readonly string[]) expect(ORDER_STATUS).toContain(to);
    }
  });
});

describe("canTransition", () => {
  it("permite PENDING → ACCEPTED y PAID → ESCROW", () => {
    expect(canTransition("PENDING", "ACCEPTED")).toBe(true);
    expect(canTransition("PAID", "ESCROW")).toBe(true);
  });

  it("bloquea el salto PENDING → PAID (regla pay-antes-de-accept)", () => {
    expect(canTransition("PENDING", "PAID")).toBe(false);
  });

  it("los terminales no transicionan", () => {
    for (const s of ["RELEASED", "REFUNDED", "CANCELLED"] as const) {
      for (const t of ORDER_STATUS) expect(canTransition(s, t)).toBe(false);
    }
  });
});

describe("cancelLabel", () => {
  it("traduce motivos conocidos", () => {
    expect(cancelLabel("TTL_EXPIRED")).toBe("Reserva expirada");
    expect(cancelLabel("SELLER_REJECTED")).toBe("Rechazado por el vendedor");
    expect(cancelLabel("BUYER_CANCELLED")).toBe(CANCEL_REASON_LABEL.BUYER_CANCELLED);
  });

  it("devuelve null sin motivo o con motivo desconocido", () => {
    expect(cancelLabel(null)).toBeNull();
    expect(cancelLabel(undefined)).toBeNull();
    expect(cancelLabel("INVENTADO")).toBeNull();
  });

  it("isCancelReason valida el conjunto cerrado", () => {
    expect(isCancelReason("TTL_EXPIRED")).toBe(true);
    expect(isCancelReason("OTRO")).toBe(false);
    expect(isCancelReason(null)).toBe(false);
  });
});
