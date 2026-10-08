import { Router } from "express";
import { HolidaySchema, HoursSchema, WeekdaySchema } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";
import { requireRole, type AuthedRequest } from "../../middleware/auth.js";
import { scheduleChange, scheduleFail } from "./scheduleGuard.js";

export const scheduleRouter = Router();
scheduleRouter.get("/", asyncHandler(async (_req, res) => {
  const [hours, holidays] = await Promise.all([prisma.openingHours.findMany({ orderBy: { weekday: "asc" } }), prisma.holiday.findMany({ orderBy: { date: "asc" } })]);
  res.json({ data: { hours, holidays, timezone: "America/Lima" } });
}));
scheduleRouter.put("/hours/:weekday", requireRole("admin"), asyncHandler(async (req: AuthedRequest, res) => {
  const weekday = WeekdaySchema.parse(req.params.weekday), input = HoursSchema.parse(req.body);
  const data = await scheduleChange(req.user!.sub, "hours.save", "openingHours", String(weekday), async (tx) => {
    if (await tx.staffShift.count({ where: { weekday, OR: [{ startsMin: { lt: input.opens } }, { endsMin: { gt: input.closes } }] } })) {
      scheduleFail("HAS_SHIFTS", "Este horario dejaría turnos fuera; ajusta los turnos primero");
    }
    return tx.openingHours.upsert({ where: { weekday }, create: { weekday, ...input }, update: input });
  });
  res.json({ data });
}));
scheduleRouter.delete("/hours/:weekday", requireRole("admin"), asyncHandler(async (req: AuthedRequest, res) => {
  const weekday = WeekdaySchema.parse(req.params.weekday);
  const data = await scheduleChange(req.user!.sub, "hours.delete", "openingHours", String(weekday), async (tx) => {
    if (await tx.staffShift.count({ where: { weekday } })) scheduleFail("HAS_SHIFTS", "Quita los turnos de ese día antes de cerrarlo");
    return tx.openingHours.delete({ where: { weekday } });
  });
  res.json({ data });
}));
scheduleRouter.post("/holidays", requireRole("admin"), asyncHandler(async (req: AuthedRequest, res) => {
  const input = HolidaySchema.parse(req.body);
  const data = await scheduleChange(req.user!.sub, "holiday.create", "holiday", undefined,
    (tx) => tx.holiday.create({ data: { date: new Date(`${input.date}T00:00:00Z`), reason: input.reason } }));
  res.status(201).json({ data });
}));
scheduleRouter.delete("/holidays/:id", requireRole("admin"), asyncHandler(async (req: AuthedRequest, res) => {
  const data = await scheduleChange(req.user!.sub, "holiday.delete", "holiday", req.params.id, (tx) => tx.holiday.delete({ where: { id: req.params.id } }));
  res.json({ data });
}));
