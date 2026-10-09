import type { NextFunction, Request, Response, Router } from "express";
import { errorHandler } from "../../middleware/errors.js";
export function accountRequest(router: Router, method: string, url: string, token?: string, body: unknown = {}) {
  return new Promise<{ status: number; body: { data?: unknown; error?: { code: string } } }>((resolve) => {
    const req = { method, url, headers: token ? { authorization: `Bearer ${token}` } : {}, body } as Request;
    const res = { statusCode: 200, setHeader() {},
      status(this: Response, code: number) { this.statusCode = code; return this; },
      send(this: Response, value: unknown) { resolve({ status: this.statusCode, body: { data: value } }); return this; },
      json(this: Response, value: { data?: unknown; error?: { code: string } }) { resolve({ status: this.statusCode, body: value }); return this; },
    } as unknown as Response;
    const actual = router as Router & { handle: (req: Request, res: Response, next: NextFunction) => void };
    actual.handle(req, res, (error?: unknown) => error ? errorHandler(error, req, res, () => {}) : res.status(404).json({}));
  });
}
