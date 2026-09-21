import { PrismaClient } from "@prisma/client";
import { expiredPatch } from "../modules/orders/reservation.js";
import { notify } from "../lib/notify.js";

export interface ExpireResult {
  expired: number;
  mode: "direct" | "pooled";
  claimed: string[];
}

/**
 * Reclama reservas PENDING vencidas por lotes de 500.
 *
 * Atomicidad sin depender del pooler: el reclamo es SELECT ... FOR UPDATE
 * SKIP LOCKED dentro de una transacción. Dos workers (o dos ticks) nunca
 * reclaman la misma fila, funcione o no el lock consultivo, en cualquier
 * modo de pool (incluido el transaction pooler de Neon, donde los advisory
 * locks entre queries separadas no son confiables).
 *
 * Conexión: usa DIRECT_DATABASE_URL (PostgreSQL directo, sin pooler) si está
 * definida; si no, DATABASE_URL. Idempotente: solo toca filas aún PENDING.
 */
export async function expireReservations(now: Date = new Date()): Promise<ExpireResult> {
  const direct = (process.env.DIRECT_DATABASE_URL ?? "").trim();
  const url = direct || process.env.DATABASE_URL;
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  const claimed: string[] = [];
  try {
    for (;;) {
      const batch = await prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<Array<{ id: string; buyerId: string; itemTitle: string }>>`
          SELECT id, "buyerId", "itemTitle" FROM "Order"
          WHERE status = 'PENDING' AND "expiresAt" IS NOT NULL AND "expiresAt" <= ${now}
          ORDER BY "expiresAt" ASC
          LIMIT 500
          FOR UPDATE SKIP LOCKED`;
        if (rows.length === 0) return [];
        const ids = rows.map((r) => r.id);
        await tx.order.updateMany({
          where: { id: { in: ids }, status: "PENDING" },
          data: expiredPatch(now),
        });
        return rows;
      });
      if (batch.length === 0) break;
      claimed.push(...batch.map((r) => r.id));
      // Aviso al comprador (fuera de la transacción; notify nunca lanza).
      for (const r of batch) {
        await notify({
          userId: r.buyerId,
          type: "ORDER_EXPIRED",
          title: "Tu reserva expiró",
          body: `${r.itemTitle} — genera un nuevo pedido si aún la quieres.`,
          link: "/pedidos",
        });
      }
      if (batch.length < 500) break;
    }
    return { expired: claimed.length, mode: direct ? "direct" : "pooled", claimed };
  } finally {
    await prisma.$disconnect();
  }
}
