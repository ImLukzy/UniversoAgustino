import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationType } from "@prisma/client";
import { NOTIFICATION_CATEGORY, notificationTypes } from "@hub/shared";
import type { NextFunction, Request, Response } from "express";
import { notificationsRouter } from "./routes.js";
import { errorHandler } from "../../middleware/errors.js";

const h = vi.hoisted(() => ({ count: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() }));
vi.mock("../../lib/prisma.js", () => ({ prisma: { notification: h } }));
vi.mock("../../lib/auth.js", () => ({ verifyAccess: () => ({ sub: "actor", role: "student" }) }));
function request(query: Record<string, string> = {}, method = "GET", url = "/", auth = true) {
  return new Promise<{ status: number; body: unknown }>((resolve) => {
    const req = { method, url, query, headers: auth ? { authorization: "Bearer student" } : {} } as Request;
    const res = { statusCode: 200, status(this: Response, code: number) { this.statusCode = code; return this; },
      json(this: Response, body: unknown) { resolve({ status: this.statusCode, body }); return this; } } as Response;
    const next: NextFunction = (err) => err ? errorHandler(err, req, res, next) : resolve({ status: 404, body: null });
    (notificationsRouter as unknown as { handle: (req: Request, res: Response, next: NextFunction) => void }).handle(req, res, next);
  });
}
beforeEach(() => { vi.clearAllMocks(); h.count.mockResolvedValue(7); h.findMany.mockResolvedValue([]); h.updateMany.mockResolvedValue({ count: 2 }); });
describe("categorías de notificaciones", () => {
  it("cubre cada tipo Prisma sin tipos extra", () => {
    expect(Object.keys(NOTIFICATION_CATEGORY).sort()).toEqual(Object.values(NotificationType).sort());
  });
  it.each(["orders", "publications", "team"] as const)("filtra %s antes de contar y paginar", async (category) => {
    const result = await request({ category, unread: "1", page: "2", pageSize: "3" });
    expect(result.status).toBe(200);
    const where = { userId: "actor", readAt: null, type: { in: notificationTypes(category) } };
    expect(h.count).toHaveBeenCalledWith({ where });
    expect(h.findMany).toHaveBeenCalledWith({ where, orderBy: { createdAt: "desc" }, skip: 3, take: 3 });
    expect(result.body).toEqual({ data: [], page: 2, pageSize: 3, total: 7 });
  });
  it("sin categoría incluye todos los tipos y limita página a 50", async () => {
    await request({ pageSize: "999" });
    expect(h.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "actor" }, take: 50 }));
  });
  it("rechaza categorías desconocidas", async () => {
    expect((await request({ category: "unknown" })).status).toBe(400);
    expect(h.findMany).not.toHaveBeenCalled();
  });
  it("exige sesión", async () => { expect((await request({}, "GET", "/", false)).status).toBe(401); });
  it("marcar todo conserva aislamiento del usuario", async () => {
    expect((await request({}, "POST", "/read-all")).status).toBe(200);
    expect(h.updateMany).toHaveBeenCalledWith({ where: { userId: "actor", readAt: null }, data: { readAt: expect.any(Date) } });
  });
});
