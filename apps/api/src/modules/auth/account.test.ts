import { Router } from "express";
import type { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerAccount } from "./account.js";
import { registerPassword } from "./password.js";
import { accountRequest } from "../staff/accountFixture.js";

const h = vi.hoisted(() => ({
  refreshToken: { findUnique: vi.fn(), updateMany: vi.fn() }, passwordResetToken: { findUnique: vi.fn(), update: vi.fn() },
  user: { findUniqueOrThrow: vi.fn(), update: vi.fn() }, transaction: vi.fn(), startSession: vi.fn(), clearRefreshCookie: vi.fn(), hashPassword: vi.fn(),
}));
vi.mock("../../lib/prisma.js", () => ({ prisma: { ...h, $transaction: h.transaction } }));
vi.mock("../../lib/auth.js", () => ({ sha256: (raw: string) => raw, verifyRefresh: () => ({ sub: "user", jti: "jti" }), hashPassword: h.hashPassword, verifyPassword: vi.fn() }));
vi.mock("../../lib/session.js", () => ({ startSession: h.startSession, clearRefreshCookie: h.clearRefreshCookie }));
vi.mock("../../lib/mailer.js", () => ({ mailer: { sendPasswordReset: vi.fn() } }));
vi.mock("../../env.js", () => ({ env: { WEB_ORIGIN: ["http://localhost:5173"] } }));

const router = Router();
registerAccount(router);
const passwordRouter = Router();
registerPassword(passwordRouter);
let row: { id: string; hash: string; expiresAt: Date; revoked: boolean; rotatedAt: Date | null };

function request(path: string, cookie = "refresh", body = {}, route = router) {
  return new Promise<{ status: number; body: { data?: { access?: string }; error?: { code: string } } }>((resolve) => {
    const req = { method: "POST", url: path, originalUrl: path, headers: {}, body, cookies: { hub_refresh: cookie }, get: () => undefined } as unknown as Request;
    let statusCode = 200;
    const res = { status(code: number) { statusCode = code; return this; }, json(body: { data?: { access?: string }; error?: { code: string } }) { resolve({ status: statusCode, body }); return this; } } as unknown as Response;
    const actual = route as Router & { handle: (req: Request, res: Response, next: () => void) => void };
    actual.handle(req, res, () => resolve({ status: 500, body: {} }));
  });
}

beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-13T12:00:00Z"));
  row = { id: "token", hash: "refresh", expiresAt: new Date(Date.now() + 60_000), revoked: false, rotatedAt: null };
  h.refreshToken.findUnique.mockImplementation(async () => ({ ...row }));
  h.refreshToken.updateMany.mockImplementation(async ({ where, data }) => {
    if (where.revoked === false && row.revoked) return { count: 0 };
    Object.assign(row, data); return { count: 1 };
  });
  h.user.findUniqueOrThrow.mockResolvedValue({ id: "user", role: "student" });
  h.passwordResetToken.findUnique.mockResolvedValue({ id: "reset", userId: "user", usedAt: null, expiresAt: new Date(Date.now() + 60_000) });
  h.user.update.mockResolvedValue({}); h.passwordResetToken.update.mockResolvedValue({}); h.hashPassword.mockResolvedValue("new-password-hash");
  h.transaction.mockImplementation(async (items) => Promise.all(items));
  h.startSession.mockResolvedValue("new-access");
});
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });

describe("rotación de refresh", () => {
  it("rota un token activo y marca el instante de gracia", async () => {
    const result = await request("/refresh");
    expect(result).toMatchObject({ status: 200, body: { data: { access: "new-access" } } });
    expect(row).toMatchObject({ revoked: true, rotatedAt: new Date(Date.now()) });
  });
  it("acepta un token rotado a los 5 s", async () => {
    row.revoked = true; row.rotatedAt = new Date(Date.now() - 5_000);
    expect((await request("/refresh")).status).toBe(200);
  });
  it("rechaza un token rotado a los 31 s y uno cerrado por logout", async () => {
    row.revoked = true; row.rotatedAt = new Date(Date.now() - 31_000);
    expect((await request("/refresh")).status).toBe(401);
    row.revoked = false; row.rotatedAt = null;
    await request("/logout");
    expect(row).toMatchObject({ revoked: true, rotatedAt: null });
    expect((await request("/refresh")).status).toBe(401);
  });
  it("cambio de contraseña revoca también la gracia de una rotación previa", async () => {
    row.revoked = true; row.rotatedAt = new Date(Date.now() - 1_000);
    vi.useRealTimers();
    h.passwordResetToken.findUnique.mockResolvedValue({ id: "reset", userId: "user", usedAt: null, expiresAt: new Date(Date.now() + 60_000) });
    const reset = await accountRequest(passwordRouter, "POST", "/reset", undefined, { token: "r".repeat(32), password: "Temporal123!" });
    expect(reset.status).toBe(200);
    expect(h.refreshToken.updateMany).toHaveBeenCalledWith({ where: { userId: "user" }, data: { revoked: true, rotatedAt: null } });
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-13T12:00:00Z"));
    expect((await request("/refresh")).status).toBe(401);
  });
  it("dos refresh concurrentes con la misma cookie reciben sesión", async () => {
    const results = await Promise.all([request("/refresh"), request("/refresh")]);
    expect(results.map((result) => result.status)).toEqual([200, 200]);
    expect(h.startSession).toHaveBeenCalledTimes(2);
  });
});
