import { prisma } from "../../lib/prisma.js";
export async function sendPayoutReminders(now = new Date()) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(300030)::text`;
    const rows = await tx.payout.findMany({ where: { status: "PENDING", reminderSentAt: null,
      dueAt: { lte: new Date(now.getTime() + 6 * 3600000) } }, orderBy: { dueAt: "asc" }, take: 100 });
    for (const p of rows) {
      await tx.payout.update({ where: { id: p.id }, data: { reminderSentAt: now } });
      await tx.notification.create({ data: { userId: p.collectorId, type: "PAYOUT_DUE", title: "Liquidación por vencer",
        body: `Debes liquidar S/ ${(p.netCents / 100).toFixed(2)} antes de ${p.dueAt.toLocaleString("es-PE", { timeZone: "America/Lima" })} (Lima).`, link: "/equipo?tab=liquidaciones" } });
    }
    return rows;
  });
}
