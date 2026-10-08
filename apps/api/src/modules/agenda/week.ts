import { AGENDA_DAYS, mondayOf, weekDays, type AgendaQuerySchema } from "@hub/shared";
import type { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { localInstant, localParts } from "../cases/calendar.js";

type Query = z.infer<typeof AgendaQuerySchema>;
const name = { select: { id: true, email: true, profile: { select: { fullName: true } } } } as const;
const label = (u: { email: string; profile: { fullName: string } | null }) => u.profile?.fullName || u.email;

// Solo lectura. Todo en America/Lima: semana lunes–sábado, un rango, tope de 500 citas.
export async function weekAgenda(query: Query, now = new Date()) {
  const monday = mondayOf(query.week ?? localParts(now).day), days = weekDays(monday);
  const from = localInstant(days[0]!, 0), to = localInstant(days[AGENDA_DAYS - 1]!, 24 * 60);
  const [hours, holidays, appointments, shifts, team] = await Promise.all([
    prisma.openingHours.findMany(),
    prisma.holiday.findMany({ where: { date: { gte: new Date(`${days[0]}T00:00:00Z`), lte: new Date(`${days[AGENDA_DAYS - 1]}T00:00:00Z`) } } }),
    prisma.appointment.findMany({ where: { startsAt: { gte: from, lt: to }, ...(query.sedeId ? { sedeId: query.sedeId } : {}), ...(query.staffId ? { staffId: query.staffId } : {}) },
      orderBy: { startsAt: "asc" }, take: 500,
      include: { sede: { select: { id: true, name: true } }, staff: name, party: name, case: { select: { order: { select: { itemTitle: true } } } } } }),
    prisma.staffShift.findMany({ where: { ...(query.sedeId ? { sedeId: query.sedeId } : {}), ...(query.staffId ? { userId: query.staffId } : {}) } }),
    prisma.user.findMany({ where: { role: { in: ["admin", "moderator"] } }, select: name.select, orderBy: { email: "asc" } }),
  ]);
  const holidayMap = new Map(holidays.map((h) => [h.date.toISOString().slice(0, 10), h.reason]));
  return {
    weekStart: monday,
    days: days.map((date, i) => { const h = hours.find((x) => x.weekday === i + 1);
      return { date, weekday: i + 1, open: !!h && !holidayMap.has(date), opens: h?.opens ?? null, closes: h?.closes ?? null, holiday: holidayMap.get(date) ?? null }; }),
    staff: team.map((u) => ({ id: u.id, name: label(u) })),
    shifts: shifts.map((s) => ({ userId: s.userId, sedeId: s.sedeId, weekday: s.weekday, startsMin: s.startsMin, endsMin: s.endsMin })),
    appointments: appointments.map((a) => ({ id: a.id, caseId: a.caseId, kind: a.kind, status: a.status, startsAt: a.startsAt, endsAt: a.endsAt,
      sede: a.sede, staff: { id: a.staff.id, name: label(a.staff) }, party: label(a.party), itemTitle: a.case.order.itemTitle })),
  };
}
