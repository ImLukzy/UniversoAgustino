import { describe, expect, it } from "vitest";
import { displayOrderStatus, fmtDate, pen } from "./api";

describe("pen", () => {
  it("formatea céntimos a soles", () => {
    expect(pen(1500)).toBe("S/ 15.00");
    expect(pen(169)).toBe("S/ 1.69");
    expect(pen(0)).toBe("S/ 0.00");
  });
});

describe("fmtDate", () => {
  it("nulo o ausente → em-dash", () => {
    expect(fmtDate(null)).toBe("—");
    expect(fmtDate(undefined)).toBe("—");
  });

  it("fecha ISO → cadena es-PE", () => {
    expect(fmtDate("2026-09-21T00:00:00.000Z")).toMatch(/2026/);
  });
});

describe("displayOrderStatus", () => {
  it("CANCELLED con motivo → etiqueta de causa", () => {
    expect(displayOrderStatus({ status: "CANCELLED", cancelledReason: "BUYER_CANCELLED" })).toBe(
      "Cancelado por el comprador",
    );
  });

  it("sin motivo o estado normal → null (usa mapa local)", () => {
    expect(displayOrderStatus({ status: "CANCELLED", cancelledReason: null })).toBeNull();
    expect(displayOrderStatus({ status: "PAID" })).toBeNull();
  });
});
