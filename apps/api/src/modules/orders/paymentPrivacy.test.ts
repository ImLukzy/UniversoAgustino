import type { Order } from "@prisma/client";
import { expect, it } from "vitest";
import { privateOrder } from "./paymentPrivacy.js";
const order = { status: "PAID", amountCents: 1000, netCents: 870, sellerPayDetail: "SELLER-PRIVATE", sellerPayMethod: "PLIN", sellerPayQrUrl: "/uploads/seller.png",
  payMethod: "YAPE", payDetail: "TEAM-PRIVATE", payQrUrl: "/uploads/team.png", payHolder: "Team", payPhotoUrl: "/uploads/profile.png", payProofUrl: "/uploads/proof.png", paymentAccountId: "account" } as unknown as Order;
it("ventas no exponen la cuenta del equipo ni voucher del comprador", () => {
  const seller = privateOrder(order, "seller"); expect(seller).not.toHaveProperty("payDetail"); expect(seller).not.toHaveProperty("payQrUrl"); expect(seller).not.toHaveProperty("payProofUrl"); expect(seller.netCents).toBe(870);
});
it("comprador activo recibe destino pero no datos bancarios del vendedor", () => {
  const buyer = privateOrder(order, "buyer"); expect(buyer).toHaveProperty("payDetail", "TEAM-PRIVATE"); expect(buyer).not.toHaveProperty("sellerPayDetail");
});
it("cuenta del equipo no se muestra en pedido cerrado", () => {
  const buyer = privateOrder({ ...order, status: "RELEASED" }, "buyer"); expect(buyer).not.toHaveProperty("payDetail"); expect(buyer).not.toHaveProperty("payQrUrl"); expect(buyer).toHaveProperty("payProofUrl");
});
