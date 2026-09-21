import "./env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./env.js";
import { buildRouter, mountDocs } from "./app.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { uploadsDir } from "./modules/uploads/routes.js";
import { startJobs } from "./jobs/index.js";

const app = express();
app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 60_000, max: 300 }));

app.use(env.PREFIX, buildRouter());
app.use("/uploads", express.static(uploadsDir));
mountDocs(app);
app.use(notFound);
app.use(errorHandler);

startJobs();

app.listen(env.PORT, () => {
  console.log(`[api] http://localhost:${env.PORT}${env.PREFIX}  docs http://localhost:${env.PORT}/docs`);
});
