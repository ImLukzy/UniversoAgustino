import { Router } from "express";
import { registerListing } from "./listing.js";
import { registerManage } from "./manage.js";
import { registerPreview } from "./preview.js";

// Documentos (apuntes digitales). /mine se registra antes que /:id.
export const documentsRouter = Router();
registerListing(documentsRouter);
registerPreview(documentsRouter);
registerManage(documentsRouter);
