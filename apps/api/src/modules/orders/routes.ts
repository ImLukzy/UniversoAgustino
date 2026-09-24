import { Router } from "express";
import { registerCreate } from "./create.js";
import { registerQueries } from "./queries.js";
import { registerSellerSteps } from "./sellerSteps.js";
import { registerBuyerSteps } from "./buyerSteps.js";
import { registerCloseSteps } from "./closeSteps.js";

// Pedidos: PENDING → (ACCEPTED, solo alquiler) → PAID → ESCROW → RELEASED,
// con CANCELLED/REFUNDED como cierres. Orden de registro: las rutas fijas
// (/mine, /sales) antes que /:id.
export const ordersRouter = Router();
registerCreate(ordersRouter);
registerQueries(ordersRouter);
registerSellerSteps(ordersRouter);
registerBuyerSteps(ordersRouter);
registerCloseSteps(ordersRouter);
