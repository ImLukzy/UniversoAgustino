import { expect, it } from "vitest";
import { PaymentAccountSchema } from "./paymentAccounts.js";
const account = { userId: "staff", method: "YAPE", holder: "Titular", number: "TEST-ACCOUNT", photoUrl: "/uploads/profile.png", qrUrl: "/uploads/qr.png" };
it("valida cuenta y activa por defecto", () => { expect(PaymentAccountSchema.parse(account).active).toBe(true); });
it("acepta cuenta sin foto del titular o con null", () => {
  expect(PaymentAccountSchema.parse({ ...account, photoUrl: undefined }).photoUrl).toBeUndefined();
  expect(PaymentAccountSchema.parse({ ...account, photoUrl: null }).photoUrl).toBeNull();
});
it.each(["PLIN", "OTHER"])("acepta método %s", (method) => { expect(PaymentAccountSchema.safeParse({ ...account, method }).success).toBe(true); });
it.each([{ holder: " " }, { number: " " }, { photoUrl: "https://evil.org/p.png" }, { qrUrl: "/uploads/../p.png" }, { method: "CARD" }])("rechaza cuenta incompleta o ruta externa %j", (change) => { expect(PaymentAccountSchema.safeParse({ ...account, ...change }).success).toBe(false); });
