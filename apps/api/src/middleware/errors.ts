import type { NextFunction, Request, Response } from "express";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status ?? 500;
  const code = err.code ?? (status === 500 ? "INTERNAL" : "REQUEST_ERROR");
  if (status >= 500) console.error(err);
  res.status(status).json({ error: { code, message: err.message ?? "Error interno" } });
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Recurso no encontrado" } });
}

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
