import { vi } from "vitest";
import { Router, type NextFunction, type Request, type Response } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { errorHandler } from "../../middleware/errors.js";
const h = vi.hoisted(() => {
  const model = () => ({ findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), upsert: vi.fn() });
  return { sede: model(), openingHours: model(), holiday: model(), staffShift: model(), user: model(), auditLog: model(), lock: vi.fn() };
});
vi.mock("../../lib/prisma.js", () => ({ prisma: { ...h, $transaction: async (fn: (tx: typeof h & { $queryRaw: typeof h.lock }) => Promise<unknown>) => fn({ ...h, $queryRaw: h.lock }) } }));
vi.mock("../../lib/auth.js", () => ({ verifyAccess: (token: string) => { const [role, sub = "actor"] = token.split(":"); return { role, sub }; } }));
export function resetSchedule() {
  vi.clearAllMocks(); h.sede.findMany.mockResolvedValue([]); h.openingHours.findMany.mockResolvedValue([]); h.holiday.findMany.mockResolvedValue([]);
  h.sede.findUnique.mockResolvedValue({ id: "sede", active: true }); h.sede.findUniqueOrThrow.mockResolvedValue({ id: "sede" });
  h.sede.create.mockResolvedValue({ id: "sede" }); h.sede.update.mockResolvedValue({ id: "sede" });
  h.openingHours.findUnique.mockResolvedValue({ weekday: 1, opens: 480, closes: 1080 }); h.openingHours.upsert.mockResolvedValue({ weekday: 1 });
  h.openingHours.delete.mockResolvedValue({ weekday: 1 }); h.holiday.create.mockResolvedValue({ id: "holiday" }); h.holiday.delete.mockResolvedValue({ id: "holiday" });
  h.staffShift.count.mockResolvedValue(0); h.staffShift.findMany.mockResolvedValue([]); h.staffShift.findUniqueOrThrow.mockResolvedValue({ id: "shift" });
  h.staffShift.create.mockResolvedValue({ id: "shift" }); h.staffShift.update.mockResolvedValue({ id: "shift" }); h.staffShift.delete.mockResolvedValue({ id: "shift" });
  h.user.findUnique.mockResolvedValue({ role: "moderator" }); h.auditLog.create.mockResolvedValue({ id: "audit" });
}
export function protectedRouter(child: Router) { const r = Router(); r.use(requireAuth, requireRole("admin", "moderator")); r.use(child); return r; }
export function request(router: Router, method: string, path: string, role?: string, body: unknown = {}, query = {}) {
  return new Promise<{ status: number; body: unknown }>((resolve) => {
    const req = { method, url: path, body, query, headers: role ? { authorization: `Bearer ${role}` } : {} } as Request;
    const res = { statusCode: 200, status(this: Response, code: number) { this.statusCode = code; return this; }, json(this: Response, value: unknown) { resolve({ status: this.statusCode, body: value }); return this; } } as Response;
    const next: NextFunction = (err) => err ? errorHandler(err, req, res, next) : resolve({ status: 404, body: null });
    (router as unknown as { handle: (req: Request, res: Response, next: NextFunction) => void }).handle(req, res, next);
  });
}

export { h };
