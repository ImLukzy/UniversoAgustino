import { describe, expect, it } from "vitest";
import {
  RESERVATION_TTL_MINUTES,
  blockingOrderWhere,
  expiredPatch,
  isExpired,
  nextExpiry,
} from "./reservation.js";

describe("RESERVATION_TTL", () => {
  it("por defecto son 30 minutos", () => {
    expect(RESERVATION_TTL_MINUTES).toBe(30);
  });

  it("nextExpiry cae ~30 min en el futuro", () => {
    const from = new Date("2026-01-01T12:00:00Z");
    expect(nextExpiry(from).getTime() - from.getTime()).toBe(30 * 60_000);
  });
});

describe("isExpired", () => {
  it("PENDING vencido por reloj → true", () => {
    expect(isExpired({ status: "PENDING", expiresAt: new Date(Date.now() - 1000) })).toBe(true);
  });

  it("PENDING vigente, ACCEPTED vencido o sin fecha → false", () => {
    expect(isExpired({ status: "PENDING", expiresAt: new Date(Date.now() + 60000) })).toBe(false);
    expect(isExpired({ status: "ACCEPTED", expiresAt: new Date(Date.now() - 1000) })).toBe(false);
    expect(isExpired({ status: "PENDING", expiresAt: null })).toBe(false);
  });

  it("acepta fechas ISO en string", () => {
    expect(isExpired({ status: "PENDING", expiresAt: new Date(Date.now() - 1000).toISOString() })).toBe(true);
  });
});

describe("expiredPatch", () => {
  it("escribe siempre lo mismo: CANCELLED + TTL_EXPIRED sin expiresAt", () => {
    const p = expiredPatch(new Date("2026-01-01T00:00:00Z"));
    expect(p).toEqual({
      status: "CANCELLED",
      cancelledAt: new Date("2026-01-01T00:00:00Z"),
      cancelledReason: "TTL_EXPIRED",
      expiresAt: null,
    });
  });
});

describe("blockingOrderWhere", () => {
  it("bazar: bloquea vivos y PENDING no vencidos", () => {
    const w = blockingOrderWhere("bazar", "item-1") as {
      itemType: string;
      itemId: string;
      OR: unknown[];
    };
    expect(w.itemType).toBe("bazar");
    expect(w.itemId).toBe("item-1");
    expect(w.OR).toHaveLength(2);
  });

  it("document: condición imposible (los digitales nunca bloquean)", () => {
    expect(blockingOrderWhere("document", "doc-1")).toEqual({ id: "__never__" });
  });
});
