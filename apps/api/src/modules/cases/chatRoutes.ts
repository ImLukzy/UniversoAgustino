import { Router } from "express";
import { CaseMessageSchema } from "@hub/shared";
import { asyncHandler } from "../../middleware/errors.js";
import type { AuthedRequest } from "../../middleware/auth.js";
import { listMessages, postMessage } from "./chat.js";

// Se monta en /cases/:id/messages (participantes) y /staff/cases/:id/messages (equipo):
// el permiso real se decide por caso en chat.ts, no por la ruta.
export const chatRouter = Router({ mergeParams: true });
chatRouter.get("/", asyncHandler(async (req: AuthedRequest, res) => {
  res.json({ data: await listMessages(String(req.params.id), req.user!) });
}));
chatRouter.post("/", asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json({ data: await postMessage(String(req.params.id), req.user!, CaseMessageSchema.parse(req.body).body) });
}));
