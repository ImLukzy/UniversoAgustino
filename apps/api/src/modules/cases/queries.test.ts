import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Router, type Request, type Response, type NextFunction } from "express";
import { actor, h, order, row, resetCases } from "./caseFixture.js";
import { participantCasesRouter, registerQueries } from "./queries.js";
import { errorHandler } from "../../middleware/errors.js";
vi.mock("../../lib/auth.js", () => ({ verifyAccess: (sub: string) => ({ sub, role: "student" }) }));
function request(router: Router, path: string, sub: string, query = {}) {
  return new Promise<{ status: number; body: { data?: { appointments: { kind: string }[] } | null } }>((resolve) => {
    const req = { method: "GET", url: path, query, user: { ...actor, sub }, headers: { authorization: `Bearer ${sub}` } } as unknown as Request;
    const res = { statusCode: 200, status(this: Response, code: number) { this.statusCode = code; return this; }, json(this: Response, body: { data?: { appointments: { kind: string }[] } | null }) { resolve({ status: this.statusCode, body }); return this; } } as Response;
    const next: NextFunction = (error) => error ? errorHandler(error, req, res, next) : resolve({ status: 404, body: {} });
    (router as unknown as { handle: (req: Request, res: Response, next: NextFunction) => void }).handle(req, res, next);
  });
}
beforeEach(() => { resetCases(); vi.useRealTimers(); h.order.findUnique.mockResolvedValue(order); }); afterEach(() => vi.useRealTimers());
describe("privacidad del caso", () => {
  it("comprador solo recibe sus citas y datos mínimos", async () => {
    h.handoverCase.findUnique.mockResolvedValue({ ...row, appointments: [{ kind: "DROP_OFF", partyId: "seller" }, { kind: "PICKUP", partyId: "buyer" }] });
    const result = await request(participantCasesRouter, "/order/order", "buyer");
    expect(result.status).toBe(200); expect(result.body.data?.appointments.map((a) => a.kind)).toEqual(["PICKUP"]);
    expect(result.body.data).not.toHaveProperty("order"); expect(result.body.data).not.toHaveProperty("assigneeId");
  });
  it("vendedor solo recibe entrega propia", async () => {
    h.handoverCase.findUnique.mockResolvedValue({ ...row, appointments: [{ kind: "DROP_OFF", partyId: "seller" }, { kind: "PICKUP", partyId: "buyer" }] });
    expect((await request(participantCasesRouter, "/order/order", "seller")).body.data?.appointments.map((a) => a.kind)).toEqual(["DROP_OFF"]);
  });
  it("ajeno no consulta fotos ni existencia del caso", async () => { expect((await request(participantCasesRouter, "/order/order", "third")).status).toBe(404); expect(h.handoverCase.findUnique).not.toHaveBeenCalled(); });
  it("legacy sin caso devuelve null", async () => { h.handoverCase.findUnique.mockResolvedValue(null); expect((await request(participantCasesRouter, "/order/order", "buyer")).body.data).toBeNull(); });
  it("trabajador no consulta detalle asignado a otro", async () => { const router = Router(); registerQueries(router); expect((await request(router, "/case", "other")).status).toBe(404); });
  it("lista de trabajador filtra sin asignar o propios y pagina", async () => { const router = Router(); registerQueries(router); h.handoverCase.findMany.mockResolvedValue([]); h.handoverCase.count.mockResolvedValue(0); await request(router, "/", "worker", { page: "2" }); expect(h.handoverCase.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { OR: [{ assigneeId: null }, { assigneeId: "worker" }] }, skip: 20, take: 20 })); });
});
