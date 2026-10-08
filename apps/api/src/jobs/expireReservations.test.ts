import { beforeEach, describe, expect, it, vi } from "vitest";
import { expireReservations } from "./expireReservations.js";
const h = vi.hoisted(() => ({ query: vi.fn(), update: vi.fn(), count: vi.fn(), free: vi.fn(), notify: vi.fn(), disconnect: vi.fn() }));
vi.mock("@prisma/client", () => ({ PrismaClient: class {
  $transaction = async (fn: (tx: unknown) => Promise<unknown>) => fn({ $queryRaw: h.query, order: { updateMany: h.update, count: h.count }, bazarItem: { updateMany: h.free } });
  $disconnect = h.disconnect;
} }));
vi.mock("../lib/notify.js", () => ({ notify: h.notify }));
beforeEach(() => { vi.clearAllMocks(); h.count.mockResolvedValue(0); });
describe("vencimiento por expiresAt", () => {
  it("cancela vencidos y libera bazar en la misma transacción", async () => {
    h.query.mockResolvedValue([{ id: "expired", buyerId: "buyer", itemType: "bazar", itemId: "book", itemTitle: "Libro" }]);
    const now = new Date(); expect((await expireReservations(now)).expired).toBe(1);
    expect(h.query.mock.calls[0][0].join("")).toContain('"expiresAt" <='); expect(h.query.mock.calls[0][1]).toBe(now);
    expect(h.free).toHaveBeenCalledWith({ where: { id: "book", status: "RESERVED" }, data: { status: "AVAILABLE" } });
    expect(h.notify).toHaveBeenCalledWith(expect.objectContaining({ type: "ORDER_EXPIRED" })); expect(h.disconnect).toHaveBeenCalled();
  });
  it("no libera artículo con otro pedido vivo", async () => {
    h.query.mockResolvedValue([{ id: "old", itemType: "bazar", itemId: "book" }]); h.count.mockResolvedValue(1);
    await expireReservations(); expect(h.free).not.toHaveBeenCalled();
  });
  it("documentos no alteran inventario", async () => {
    h.query.mockResolvedValue([{ id: "doc", itemType: "document" }]);
    await expireReservations(); expect(h.free).not.toHaveBeenCalled();
  });
});
