import type { Router } from "express";
import { PickupSchema } from "@hub/shared";
import { asyncHandler } from "../../middleware/errors.js";
import type { AuthedRequest } from "../../middleware/auth.js";
import { pickupCase } from "./pickup.js";
import { returnCase } from "./returns.js";
import { backToSeller } from "./close.js";

export function registerFulfillment(casesRouter: Router) {
  casesRouter.post("/:id/pickup", asyncHandler(async (req: AuthedRequest, res) => {
    res.json({ data: await pickupCase(req.params.id, req.user!, PickupSchema.parse(req.body)) });
  }));
  casesRouter.post("/:id/return", asyncHandler(async (req: AuthedRequest, res) => {
    res.json({ data: await returnCase(req.params.id, req.user!, req.body) });
  }));
  casesRouter.post("/:id/back-to-seller", asyncHandler(async (req: AuthedRequest, res) => {
    res.json({ data: await backToSeller(req.params.id, req.user!) });
  }));
}
