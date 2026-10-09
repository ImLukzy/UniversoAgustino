import { expect, it } from "vitest";
import { canTransition, canTransitionCase, RefundPayoutSchema, PayoutListSchema, notificationTypes } from "./index.js";
it("autoriza ESCROW→REFUNDED", () => expect(canTransition("ESCROW", "REFUNDED")).toBe(true));
it.each(["PENDING", "ACCEPTED", "PAID", "RELEASED", "CANCELLED", "REFUNDED"] as const)("no reembolsa %s", (s) => expect(canTransition(s, "REFUNDED")).toBe(false));
it("foto obligatoria y operación opcional", () => { expect(RefundPayoutSchema.safeParse({}).success).toBe(false); expect(RefundPayoutSchema.parse({ proofUrl: "/uploads/x.png" })).toEqual({ proofUrl: "/uploads/x.png" }); });
it("rechaza URL externa/montos enviados", () => { expect(RefundPayoutSchema.safeParse({ proofUrl: "https://other/x.png" }).success).toBe(false); expect(RefundPayoutSchema.safeParse({ proofUrl: "/uploads/x.png", amountCents: 1 }).success).toBe(false); });
it("lista REFUNDED y categoriza aviso", () => { expect(PayoutListSchema.parse({ status: "REFUNDED" }).status).toBe("REFUNDED"); expect(notificationTypes("orders")).toContain("ORDER_REFUNDED"); });
it.each(["DELIVERED", "CLOSED"] as const)("permite retorno de venta desde %s; guard de negocio vive en API", (s) => expect(canTransitionCase(s, "RETURN_SCHEDULED")).toBe(true));
