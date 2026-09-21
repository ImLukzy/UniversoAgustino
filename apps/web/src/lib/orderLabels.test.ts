import { describe, expect, it } from "vitest";
import { getOrderLabel } from "./orderLabels";

describe("getOrderLabel", () => {
  it("comprador: textos de espera", () => {
    expect(getOrderLabel("PENDING", "buyer")).toBe("Esperando pago");
    expect(getOrderLabel("ESCROW", "buyer")).toBe("En custodia");
    expect(getOrderLabel("RELEASED", "buyer")).toBe("Completado");
  });

  it("vendedor: textos de acción", () => {
    expect(getOrderLabel("PENDING", "seller")).toBe("Pendiente de aprobación");
    expect(getOrderLabel("ACCEPTED", "seller")).toBe("Aceptado · pago en espera");
    expect(getOrderLabel("PAID", "seller")).toBe("Pagado · por confirmar");
  });

  it("CANCELLED con motivo muestra la causa en ambos roles", () => {
    expect(getOrderLabel("CANCELLED", "buyer", "TTL_EXPIRED")).toBe("Reserva expirada");
    expect(getOrderLabel("CANCELLED", "seller", "SELLER_REJECTED")).toBe("Rechazado por el vendedor");
  });

  it("fail-open: estado o motivo desconocido no rompe", () => {
    expect(getOrderLabel("RARO")).toBe("RARO");
    expect(getOrderLabel("CANCELLED", "buyer", "INVENTADO")).toBe("Cancelado");
  });
});
