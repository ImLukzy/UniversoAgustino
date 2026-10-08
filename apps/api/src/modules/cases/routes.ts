import { Router } from "express";
import { z } from "zod";
import { AssignmentSchema, AppointmentSchema, ReceiveSchema } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";
import type { AuthedRequest } from "../../middleware/auth.js";
import { registerQueries } from "./queries.js";
import { assignCase } from "./assignment.js";
import { bookCase, markNoShow } from "./appointments.js";
import { cancelCase } from "./cancel.js";
import { receiveCase } from "./receive.js";
import { calendarData, managedCase } from "./caseGuard.js";
import { deadline, localInstant, localParts, SLOT_MS, validSlot } from "./calendar.js";

export const casesRouter = Router();
registerQueries(casesRouter);
casesRouter.post("/:id/take", asyncHandler(async (req: AuthedRequest, res) => {
  res.json({ data: await assignCase(req.params.id, req.user!.sub, req.user!, true) });
}));
casesRouter.post("/:id/assign", asyncHandler(async (req: AuthedRequest, res) => {
  res.json({ data: await assignCase(req.params.id, AssignmentSchema.parse(req.body).assigneeId, req.user!) });
}));
casesRouter.get("/:id/slots", asyncHandler(async (req: AuthedRequest, res) => {
  const kind = z.enum(["DROP_OFF", "PICKUP"]).parse(req.query.kind);
  const row = await managedCase(prisma, req.params.id, req.user!), now = new Date();
  const anchor = kind === "DROP_OFF" ? row.order.acceptedAt : row.receivedAt;
  if (!anchor || !row.assigneeId) return res.json({ data: [] });
  const data = await calendarData(prisma), limit = deadline(anchor, data.hours, data.holidays);
  const shifts = await prisma.staffShift.findMany({ where: { userId: row.assigneeId, sede: { active: true }, ...(kind === "PICKUP" && row.sedeId ? { sedeId: row.sedeId } : {}) }, include: { sede: true } });
  const booked = await prisma.appointment.findMany({ where: { staffId: row.assigneeId, status: "SCHEDULED", endsAt: { gt: now }, startsAt: { lt: limit } } });
  const slots: { sedeId: string; sedeName: string; startsAt: string }[] = [];
  const first = localInstant(localParts(now).day, 0);
  for (let offset = 0; offset < 90; offset++) {
    const day = new Date(first.getTime() + offset * 86_400_000);
    if (day > limit) break;
    const part = localParts(day);
    for (const shift of shifts.filter((s) => s.weekday === part.weekday)) {
      for (let minute = Math.ceil(shift.startsMin / 15) * 15; minute + 15 <= shift.endsMin; minute += 15) {
        const startsAt = localInstant(part.day, minute), endsAt = new Date(startsAt.getTime() + SLOT_MS);
        try { validSlot(startsAt, now, limit, data.hours, data.holidays); } catch { continue; }
        if (!booked.some((a) => a.startsAt < endsAt && a.endsAt > startsAt)) slots.push({ sedeId: shift.sedeId, sedeName: shift.sede.name, startsAt: startsAt.toISOString() });
      }
    }
  }
  res.json({ data: slots });
}));
casesRouter.post("/:id/appointments", asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json({ data: await bookCase(req.params.id, req.user!, AppointmentSchema.parse(req.body)) });
}));
casesRouter.post("/:id/appointments/:appointmentId/no-show", asyncHandler(async (req: AuthedRequest, res) => {
  res.json({ data: await markNoShow(req.params.id, req.params.appointmentId, req.user!) });
}));
casesRouter.post("/:id/appointments/:appointmentId/reschedule", asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json({ data: await bookCase(req.params.id, req.user!, AppointmentSchema.parse(req.body), req.params.appointmentId) });
}));
casesRouter.post("/:id/receive", asyncHandler(async (req: AuthedRequest, res) => {
  const input = ReceiveSchema.parse(req.body);
  res.json({ data: await receiveCase(req.params.id, req.user!, input.photoUrl, input.conditionNote) });
}));

casesRouter.post("/:id/cancel", asyncHandler(async (req: AuthedRequest, res) => {
  res.json({ data: await cancelCase(req.params.id, req.user!) });
}));
