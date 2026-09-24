import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "./lib/prisma.js";
import { asyncHandler } from "./middleware/errors.js";
import { authRouter } from "./modules/auth/routes.js";
import { oauthRouter } from "./modules/auth/oauth.js";
import { documentsRouter } from "./modules/documents/routes.js";
import { bazarRouter } from "./modules/bazar/routes.js";
import { ordersRouter } from "./modules/orders/routes.js";
import { monetizationRouter, reportsRouter } from "./modules/extra/routes.js";
import { notificationsRouter } from "./modules/notifications/routes.js";
import { uploadsRouter } from "./modules/uploads/routes.js";
import { paymentsRouter } from "./modules/payments/routes.js";

export function buildRouter() {
  const r = Router();

  r.get(
    "/health",
    asyncHandler(async (_req, res) => {
      res.json({ ok: true, service: "api", time: new Date().toISOString() });
    })
  );

  r.get(
    "/ready",
    asyncHandler(async (_req, res) => {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ ok: true, db: "up" });
    })
  );

  r.use("/auth", authRouter);
  r.use("/auth/oauth", oauthRouter);
  r.use("/documents", documentsRouter);
  r.use("/bazar", bazarRouter);
  r.use("/orders", ordersRouter);
  r.use("/monetization", monetizationRouter);
  r.use("/reports", reportsRouter);
  r.use("/notifications", notificationsRouter);
  r.use("/uploads", uploadsRouter);
  r.use("/payments", paymentsRouter);

  r.get("/legal/summary", (_req, res) => {
    res.json({
      data: {
        law: "D.L. 822 - Ley sobre el Derecho de Autor (Peru)",
        takedownSlaHours: 48,
        allowed: ["Apuntes propios", "Guias PAE originales", "Balotarios de elaboracion propia"],
        forbidden: ["Libros escaneados con copyright", "Examenes filtrados", "Datos de pacientes"],
      },
    });
  });

  return r;
}

export function mountDocs(app: import("express").Express) {
  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const raw = fs.readFileSync(path.join(here, "../../docs/openapi.yaml"), "utf8");
    const doc = YAML.parse(raw);
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(doc));
  } catch {
    app.get("/docs", (_req, res) => res.json({ data: "Agrega docs/openapi.yaml para ver Swagger" }));
  }
}
