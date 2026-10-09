import { beforeEach, describe, expect, it, vi } from "vitest";
const h = vi.hoisted(() => ({ findUnique: vi.fn(), send: vi.fn() }));
vi.mock("./prisma.js", () => ({ prisma: { user: { findUnique: h.findUnique } } }));
vi.mock("./mailer.js", () => ({ mailer: { sendNotice: h.send } }));
import { isCritical, sendCriticalMail } from "./criticalMail.js";
beforeEach(() => { vi.resetAllMocks(); h.findUnique.mockResolvedValue({ email: "a@unsa.edu.pe" }); process.env.WEB_ORIGIN = "https://universoagustino.site,https://www.universoagustino.site"; });
describe("correo de eventos críticos", () => {
  it("solo los tipos críticos envían correo", async () => {
    await sendCriticalMail({ userId: "u", type: "CASE_MESSAGE", title: "t", body: "b" });
    expect(h.send).not.toHaveBeenCalled();
    expect(isCritical("ORDER_APPOINTMENT_REMINDER")).toBe(true);
    expect(isCritical("ORDER_PAID")).toBe(true);
  });
  it("envía con enlace absoluto del primer origen", async () => {
    await sendCriticalMail({ userId: "u", type: "ORDER_ACCEPTED", title: "Aceptada", body: "Libro", link: "/pedidos" });
    expect(h.send).toHaveBeenCalledWith("a@unsa.edu.pe", "Aceptada", "Libro", "https://universoagustino.site/pedidos");
  });
  it("un fallo del correo no lanza", async () => {
    h.send.mockRejectedValue(new Error("resend_500"));
    await expect(sendCriticalMail({ userId: "u", type: "ORDER_CREATED", title: "t", body: "b" })).resolves.toBeUndefined();
  });
  it("usuario inexistente no lanza ni envía", async () => {
    h.findUnique.mockResolvedValue(null);
    await sendCriticalMail({ userId: "u", type: "ORDER_CREATED", title: "t", body: "b" });
    expect(h.send).not.toHaveBeenCalled();
  });
});

it.each(["ORDER_PAID", "PAYMENT_VERIFIED", "PAYMENT_REJECTED", "PAYOUT_PENDING"] as const)("aviso %s también envía correo", async (type) => {
  await sendCriticalMail({ userId: "buyer", type, title: "Pago", body: "Apunte", link: "/checkout/order" });
  expect(h.send).toHaveBeenCalledWith("a@unsa.edu.pe", "Pago", "Apunte", "https://universoagustino.site/checkout/order");
});
