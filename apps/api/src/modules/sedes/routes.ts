import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";

export const sedesRouter = Router();
sedesRouter.get("/", asyncHandler(async (_req, res) => {
  res.json({ data: await prisma.sede.findMany({ where: { active: true }, orderBy: { name: "asc" },
    select: { id: true, name: true, address: true, meetingPoint: true, photoUrl: true } }) });
}));
sedesRouter.get("/schedule", asyncHandler(async (_req, res) => {
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Lima" }).format(new Date());
  const [hours, holidays] = await Promise.all([
    prisma.openingHours.findMany({ orderBy: { weekday: "asc" } }),
    prisma.holiday.findMany({ where: { date: { gte: new Date(`${today}T00:00:00Z`) } }, orderBy: { date: "asc" }, take: 60 }),
  ]);
  res.json({ data: { hours, holidays, timezone: "America/Lima" } });
}));
