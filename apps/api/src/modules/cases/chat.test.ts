import { beforeEach, describe, expect, it, vi } from "vitest";
const h = vi.hoisted(() => ({ handoverCase: { findUnique: vi.fn() }, user: { findUnique: vi.fn() },
  caseMessage: { findMany: vi.fn(), count: vi.fn(), create: vi.fn() }, auditLog: { create: vi.fn() },
  notification: { findFirst: vi.fn() }, notify: vi.fn() }));
vi.mock("../../lib/prisma.js", () => ({ prisma: h }));
vi.mock("../../lib/notify.js", () => ({ notify: h.notify }));
import { listMessages, postMessage } from "./chat.js";
const order = { buyerId: "buyer", sellerId: "seller", itemTitle: "Libro" };
const row = { id: "case", status: "ASSIGNED", assigneeId: "worker", order };
const as = (sub: string, role: string) => { h.user.findUnique.mockResolvedValue({ role }); return { sub, role }; };
beforeEach(() => {
  vi.resetAllMocks(); h.handoverCase.findUnique.mockResolvedValue(row);
  h.caseMessage.count.mockResolvedValue(0); h.caseMessage.create.mockResolvedValue({ id: "m" }); h.notification.findFirst.mockResolvedValue(null);
});
describe("permisos del chat", () => {
  it.each([["buyer", "student"], ["seller", "creator"], ["worker", "moderator"], ["tech", "admin"]])("%s accede", async (sub, role) => {
    h.caseMessage.findMany.mockResolvedValue([]);
    await expect(listMessages("case", as(sub, role))).resolves.toEqual([]);
  });
  it("ajeno recibe 404", async () => { await expect(listMessages("case", as("other", "student"))).rejects.toMatchObject({ status: 404 }); });
  it("trabajador no asignado recibe 404", async () => { await expect(postMessage("case", as("otherWorker", "moderator"), "hola")).rejects.toMatchObject({ status: 404 }); });
  it("trabajador revocado (ya creator) pierde acceso aunque esté asignado", async () => { await expect(listMessages("case", as("worker", "creator"))).rejects.toMatchObject({ status: 404 }); });
  it("caso inexistente 404", async () => { h.handoverCase.findUnique.mockResolvedValue(null); await expect(listMessages("x", as("buyer", "student"))).rejects.toMatchObject({ status: 404 }); });
  it("devuelve autor y marca de equipo", async () => {
    h.caseMessage.findMany.mockResolvedValue([{ id: "1", body: "hola", createdAt: new Date(), authorId: "worker", author: { id: "worker", role: "moderator", profile: { fullName: "Ana" } } }]);
    expect((await listMessages("case", as("buyer", "student")))[0]).toMatchObject({ authorName: "Ana", staff: true });
  });
});
describe("envío", () => {
  it("guarda, audita sin cuerpo y avisa a los demás", async () => {
    await postMessage("case", as("buyer", "student"), "¿a qué hora?");
    expect(h.caseMessage.create).toHaveBeenCalledWith({ data: { caseId: "case", authorId: "buyer", body: "¿a qué hora?" } });
    expect(h.auditLog.create).toHaveBeenCalledWith({ data: { actorId: "buyer", action: "case.message", entity: "HandoverCase", entityId: "case" } });
    expect(h.notify.mock.calls.map((c) => c[0].userId).sort()).toEqual(["seller", "worker"]);
    expect(h.notify).toHaveBeenCalledWith(expect.objectContaining({ userId: "seller", type: "CASE_MESSAGE", link: "/ventas?case=case" }));
    expect(h.notify).toHaveBeenCalledWith(expect.objectContaining({ userId: "worker", link: "/equipo?case=case" }));
  });
  it("no avisa al autor", async () => {
    await postMessage("case", as("worker", "moderator"), "ok");
    expect(h.notify.mock.calls.map((c) => c[0].userId)).not.toContain("worker");
  });
  it("agrupa: si ya hay un aviso sin leer no crea otro", async () => {
    h.notification.findFirst.mockResolvedValue({ id: "n" });
    await postMessage("case", as("buyer", "student"), "otra");
    expect(h.notify).not.toHaveBeenCalled();
  });
  it.each(["CLOSED", "CANCELLED"])("caso %s no admite mensajes", async (status) => {
    h.handoverCase.findUnique.mockResolvedValue({ ...row, status });
    await expect(postMessage("case", as("buyer", "student"), "hola")).rejects.toMatchObject({ code: "CASE_CLOSED" });
    expect(h.caseMessage.create).not.toHaveBeenCalled();
  });
  it("30 mensajes en 10 minutos → 429", async () => {
    h.caseMessage.count.mockResolvedValue(30);
    await expect(postMessage("case", as("buyer", "student"), "hola")).rejects.toMatchObject({ status: 429, code: "RATE_LIMITED" });
  });
});
