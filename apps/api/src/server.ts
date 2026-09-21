import "./env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./env.js";
import { buildRouter, mountDocs } from "./app.js";
import { limit } from "./middleware/rateLimit.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { serveUpload } from "./middleware/serveUploads.js";
import { startJobs } from "./jobs/index.js";

const app = express();
app.disable("x-powered-by");
// Sprint 4 (F4-02): endurecimiento de cabeceras. CSP en modo report-only:
// primero 48 h de observación (consola del navegador) y solo entonces
// CSP_ENFORCE=true. No enforcing a ciegas: pdf.js (blob: workers),
// Google Fonts y el HMR de Vite romperían en modo bloqueante sin la lista
// exacta. crossOriginResourcePolicy se mantiene desactivado porque los
// <img> y previews cargan /uploads desde otro origen en dev.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        workerSrc: ["'self'", "blob:"],
        styleSrc: ["'self'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "blob:", "http://localhost:4000", "http://localhost:5173"],
        connectSrc: ["'self'", "http://localhost:4000", "http://localhost:5173", "ws:", "wss:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
      reportOnly: process.env.CSP_ENFORCE !== "true",
    },
    crossOriginResourcePolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);
app.use((_req, res, next) => {
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(limit({ windowMs: 60_000, max: 300 }));

app.use(env.PREFIX, buildRouter());
// Sprint 4 (F4-01): servicio controlado (cabeceras defensivas + UUID).
// Reemplaza express.static directo sobre el directorio de subidas.
app.get("/uploads/:name", serveUpload);
mountDocs(app);
app.use(notFound);
app.use(errorHandler);

startJobs();

app.listen(env.PORT, () => {
  console.log(`[api] http://localhost:${env.PORT}${env.PREFIX}  docs http://localhost:${env.PORT}/docs`);
});
