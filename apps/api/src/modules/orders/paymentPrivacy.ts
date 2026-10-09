import type { Order } from "@prisma/client";
export function privateOrder<T extends Order>(order: T, audience: "buyer" | "seller") {
  const { sellerPayMethod: _sm, sellerPayDetail: _sd, sellerPayQrUrl: _sq,
    payMethod, payDetail, payQrUrl, payHolder, payPhotoUrl, payProofUrl, paymentAccountId, ...safe } = order;
  if (audience === "seller") return safe;
  return { ...safe, payProofUrl, paymentAccountId,
    ...(["PENDING", "ACCEPTED", "PAID"].includes(order.status) ? { payMethod, payDetail, payQrUrl, payHolder, payPhotoUrl } : {}) };
}
