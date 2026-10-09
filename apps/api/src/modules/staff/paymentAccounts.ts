import { accountRole } from "./accountPermissions.js";
import { Router } from "express";
import { PaymentAccountSchema, PaymentAccountUpdateSchema } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";
import { type AuthedRequest } from "../../middleware/auth.js";
import { ownPhoto } from "../cases/evidence.js";
import { scheduleFail } from "./scheduleGuard.js";

export const paymentAccountsRouter = Router();
paymentAccountsRouter.get("/", asyncHandler(async (req: AuthedRequest, res) => {
  const role = await accountRole(prisma, req.user!.sub);
  const data = await prisma.paymentAccount.findMany({
    where: role === "admin" ? {} : { userId: req.user!.sub }, orderBy: { createdAt: "asc" },
  });
  res.setHeader("Cache-Control", "private, no-store"); res.json({ data });
}));
paymentAccountsRouter.post("/", asyncHandler(async (req: AuthedRequest, res) => {
  const input = PaymentAccountSchema.parse(req.body);
  const data = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(300030)::text`;
    const role = await accountRole(tx, req.user!.sub);
    if (role !== "admin" && input.userId !== req.user!.sub) scheduleFail("FORBIDDEN", "Solo puedes publicar tus cuentas", 403);
    const owner = await tx.user.findUnique({ where: { id: input.userId }, select: { role: true } });
    if (!owner || !["admin", "moderator"].includes(owner.role)) scheduleFail("NOT_STAFF", "El titular debe pertenecer al equipo", 400);
    for (const url of [input.photoUrl, input.qrUrl]) {
      await ownPhoto(tx, url, req.user!.sub);
      await tx.upload.update({ where: { storedName: url.slice(9) }, data: { private: true } });
    }
    const account = await tx.paymentAccount.create({ data: input });
    await tx.auditLog.create({ data: { actorId: req.user!.sub, action: "paymentAccount.create", entity: "paymentAccount", entityId: account.id } });
    return account;
  });
  res.status(201).json({ data });
}));
paymentAccountsRouter.patch("/:id", asyncHandler(async (req: AuthedRequest, res) => {
  const input = PaymentAccountUpdateSchema.parse(req.body);
  const data = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(300030)::text`;
    const role = await accountRole(tx, req.user!.sub);
    const account = await tx.paymentAccount.findUnique({ where: { id: req.params.id } });
    if (!account) scheduleFail("NOT_FOUND", "Cuenta no encontrada", 404);
    if (role !== "admin" && account.userId !== req.user!.sub) scheduleFail("FORBIDDEN", "Solo puedes editar tus cuentas", 403);
    for (const url of [input.photoUrl, input.qrUrl]) {
      if ([account.photoUrl, account.qrUrl].includes(url)) continue;
      await ownPhoto(tx, url, req.user!.sub);
      await tx.upload.update({ where: { storedName: url.slice(9) }, data: { private: true } });
    }
    const changed = await tx.paymentAccount.update({ where: { id: account.id }, data: input });
    await tx.auditLog.create({ data: { actorId: req.user!.sub, action: "paymentAccount.update", entity: "paymentAccount", entityId: account.id } });
    return changed;
  });
  res.json({ data });
}));
