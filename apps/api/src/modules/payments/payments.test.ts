import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifySignature, type MpPayment } from "../../lib/mercadopago.js";
import { settle } from "./settle.js";

const SECRET = "test-webhook-secret";
const sign = (manifest: string) => crypto.createHmac("sha256", SECRET).update(manifest).digest("hex");

describe("verifySignature (webhook Mercado Pago)", () => {
  it("acepta el manifiesto oficial id;request-id;ts", () => {
    const v1 = sign("id:123456;request-id:req-1;ts:1704908010;");
    expect(verifySignature(`ts=1704908010,v1=${v1}`, "req-1", "123456", SECRET)).toBe(true);
  });

  it("rechaza firma alterada, otro id, sin cabecera o sin secreto", () => {
    const v1 = sign("id:123456;request-id:req-1;ts:1704908010;");
    expect(verifySignature(`ts=1704908010,v1=${v1.replace(/.$/, "0")}`, "req-1", "123456", SECRET)).toBe(false);
    expect(verifySignature(`ts=1704908010,v1=${v1}`, "req-1", "999999", SECRET)).toBe(false);
    expect(verifySignature(undefined, "req-1", "123456", SECRET)).toBe(false);
    expect(verifySignature(`ts=1704908010,v1=${v1}`, "req-1", "123456", "")).toBe(false);
  });
});

const pay = (p: Partial<MpPayment> = {}): MpPayment => ({ id: 1, status: "approved", external_reference: "o1", transaction_amount: 15, currency_id: "PEN", ...p });
const order = (o: Partial<Parameters<typeof settle>[0]> = {}) => ({ status: "PENDING", itemType: "document", amountCents: 1500, cancelledReason: null, ...o });

describe("settle (pago aprobado → pedido)", () => {
  it("pago aprobado con monto exacto → ESCROW", () => {
    expect(settle(order(), pay())).toBe("ESCROW");
    expect(settle(order({ status: "ACCEPTED", itemType: "bazar" }), pay())).toBe("ESCROW");
  });

  it("monto o moneda distintos nunca liberan", () => {
    expect(settle(order(), pay({ transaction_amount: 1.5 }))).toBe("MISMATCH");
    expect(settle(order(), pay({ currency_id: "USD" }))).toBe("MISMATCH");
  });

  it("pendiente/rechazado se ignora y un webhook repetido es idempotente", () => {
    expect(settle(order(), pay({ status: "pending" }))).toBe("IGNORE");
    expect(settle(order({ status: "ESCROW" }), pay())).toBe("ALREADY");
  });

  it("reserva expirada: el apunte se honra, el bazar queda para reembolso", () => {
    expect(settle(order({ status: "CANCELLED", cancelledReason: "TTL_EXPIRED" }), pay())).toBe("ESCROW");
    expect(settle(order({ status: "CANCELLED", cancelledReason: "TTL_EXPIRED", itemType: "bazar" }), pay())).toBe("ORPHAN");
    expect(settle(order({ status: "CANCELLED", cancelledReason: "BUYER_CANCELLED" }), pay())).toBe("ORPHAN");
  });
});
