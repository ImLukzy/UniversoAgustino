import { prisma } from "../../lib/prisma.js";
import { localInstant, localParts } from "../cases/calendar.js";

const CUSTODY = ["IN_CUSTODY", "PICKUP_SCHEDULED", "RENTED_OUT", "RETURN_SCHEDULED", "RETURNED", "BACK_TO_SELLER"] as const;
// Solo lectura: métricas del panel del equipo (spec 34).
export async function staffMetrics(now = new Date()) {
  const today = localParts(now).day, start = localInstant(today, 0), end = localInstant(today, 24 * 60);
  const monthStart = localInstant(`${today.slice(0, 8)}01`, 0);
  const [todayAppointments, byStatus, custody, noShows, documents, bazar, reports, cash] = await Promise.all([
    prisma.appointment.count({ where: { startsAt: { gte: start, lt: end }, status: { not: "CANCELLED" } } }),
    prisma.handoverCase.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.handoverCase.groupBy({ by: ["assigneeId"], where: { status: { in: [...CUSTODY] }, assigneeId: { not: null } }, _count: { _all: true } }),
    prisma.appointment.count({ where: { status: "NO_SHOW", startsAt: { gte: monthStart } } }),
    prisma.document.count({ where: { reviewStatus: "PENDING" } }),
    prisma.bazarItem.count({ where: { reviewStatus: "PENDING" } }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.payout.groupBy({ by: ["collectorId"], where: { status: { not: "REFUNDED" }, order: { status: { not: "REFUNDED" }, itemType: "bazar", payMethod: "CASH", verifiedAt: { gte: monthStart, lte: now } } },
      _sum: { amountCents: true, feeCents: true, netCents: true }, _count: { _all: true } }),
  ]);
  const ids = [...new Set([...custody.flatMap((c) => c.assigneeId ? [c.assigneeId] : []), ...cash.map((c) => c.collectorId)])];
  const users = ids.length ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, email: true, profile: { select: { fullName: true } } } }) : [];
  return {
    todayAppointments, noShowsThisMonth: noShows, pendingReviews: documents + bazar, openReports: reports,
    casesByStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
    cashThisMonthByStaff: cash.map((c) => ({ staffId: c.collectorId, name: users.find((u) => u.id === c.collectorId)?.profile?.fullName || users.find((u) => u.id === c.collectorId)?.email || c.collectorId,
      collectedCents: c._sum.amountCents ?? 0, commissionCents: c._sum.feeCents ?? 0, netCents: c._sum.netCents ?? 0, count: c._count._all })),
    custodyByStaff: custody.flatMap((c) => { const u = users.find((x) => x.id === c.assigneeId);
      return c.assigneeId ? [{ staffId: c.assigneeId, name: u?.profile?.fullName || u?.email || "Sin nombre", count: c._count._all }] : []; }),
  };
}
