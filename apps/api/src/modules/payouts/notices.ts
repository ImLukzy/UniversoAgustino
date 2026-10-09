import type { Payout } from "@prisma/client";
import { notify } from "../../lib/notify.js";
export async function payoutNotice(p: Payout, kind: "PAYOUT_COMPLETED" | "PAYOUT_FROZEN" | "PAYOUT_RESUMED") {
  const net = (p.netCents / 100).toFixed(2);
  const text = kind === "PAYOUT_COMPLETED" ? `El equipo pagó S/ ${net}. Revisa su comprobante en Mis cobros.` :
    kind === "PAYOUT_FROZEN" ? `Liquidación congelada por reclamo: ${p.frozenReason}. El Técnico revisará el caso.` : "El Técnico autorizó continuar la liquidación.";
  await Promise.all([...new Set([p.sellerId, p.collectorId])].map((userId) => notify({ userId, type: kind,
    title: kind === "PAYOUT_COMPLETED" ? "Liquidación pagada" : kind === "PAYOUT_FROZEN" ? "Liquidación congelada" : "Liquidación reanudada",
    body: text, link: userId === p.sellerId ? "/ventas?tab=cobros#mis-cobros" : "/equipo?tab=liquidaciones" })));
}
