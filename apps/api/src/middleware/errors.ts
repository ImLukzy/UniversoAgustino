import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { MulterError } from "multer";

function isRecord(e: unknown): e is Record<string, unknown> {
  return typeof e === "object" && e !== null;
}

function prop(e: unknown, key: string): unknown {
  return isRecord(e) ? e[key] : undefined;
}

function requestId(req: Request): string {
  const h = req.headers["x-request-id"];
  if (typeof h === "string" && h.length > 0) return h.slice(0, 64);
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
  requestId: string;
}

function send(res: Response, status: number, code: string, message: string, requestId: string, details?: unknown) {
  const body: { error: ApiErrorBody } = { error: { code, message, requestId } };
  if (details !== undefined) body.error.details = details;
  return res.status(status).json(body);
}

// Sprint 4 (F1-03) + F2-07: contrato de error tipado. Todo error sale con
// { error: { code, message, details?, requestId } }.
// `err` es unknown (compatible con ErrorRequestHandler por contravarianza);
// se estrecha con instanceof y guardas antes de leer propiedades.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const rid = requestId(req);

  if (err instanceof ZodError) {
    const first = err.issues[0];
    const where = first?.path?.length ? ` (${String(first.path.join("."))})` : "";
    return send(res, 400, "VALIDATION", `${first?.message ?? "Dato inválido"}${where}`, rid);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      return send(res, 404, "NOT_FOUND", "Recurso no encontrado", rid);
    }
    if (err.code === "P2002") {
      return send(res, 409, "NOT_AVAILABLE", "El recurso ya está reservado o no está disponible", rid);
    }
    if (err.code === "P2003" || err.code === "P2014") {
      return send(res, 409, "CONFLICT_ACTIVE_ORDERS", "Existen registros relacionados", rid);
    }
  }

  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return send(res, 413, "FILE_TOO_LARGE", "El archivo supera el tamaño máximo permitido", rid, {
        limitBytes: Number(process.env.MAX_UPLOAD_MB ?? 25) * 1024 * 1024,
        field: typeof prop(err, "field") === "string" ? (prop(err, "field") as string) : undefined,
      });
    }
    if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
      return send(res, 400, "VALIDATION", "Archivo no permitido (máximo 4 por publicación)", rid);
    }
    return send(res, 400, "VALIDATION", "Error al subir el archivo", rid);
  }

  // Rechazos del fileFilter de uploads (extensión no permitida).
  const fileFilterMsg = prop(err, "message");
  if (typeof fileFilterMsg === "string" && fileFilterMsg.startsWith("Tipo no permitido")) {
    return send(res, 415, "UNSUPPORTED_FILE_TYPE", "Formato no permitido. Usa PDF, JPG, PNG o EPUB.", rid);
  }

  const statusRaw = prop(err, "status");
  const status = typeof statusRaw === "number" ? statusRaw : 500;
  const codeRaw = prop(err, "code");
  const code = typeof codeRaw === "string" ? codeRaw : status === 500 ? "INTERNAL" : "REQUEST_ERROR";
  if (status >= 500) console.error(`[${rid}]`, err);
  const messageRaw = prop(err, "message");
  const message = status === 500 ? "Error interno" : typeof messageRaw === "string" ? messageRaw : "Error en la solicitud";
  return send(res, status, code, message, rid);
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Recurso no encontrado" } });
}

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
