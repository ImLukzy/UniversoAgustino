import { prisma } from "../../lib/prisma.js";
import { sanctionEnd } from "./strikes.js";

export function blockedMessage(s: { kind: string; reason: string; endsAt: Date | null }): string {
  return s.kind === "BAN" ? `Tu cuenta está bloqueada. Motivo: ${s.reason}.`
    : `Tu cuenta está suspendida hasta el ${sanctionEnd(s)}. Motivo: ${s.reason}.`;
}
// Sanción que hoy impide solicitar y publicar (la que termina más tarde).
export function activeBlock(userId: string, now = new Date()) {
  return prisma.sanction.findFirst({ where: { userId, kind: { in: ["SUSPENSION", "BAN"] }, liftedAt: null, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
    orderBy: [{ endsAt: { sort: "desc", nulls: "first" } }] });
}
export async function assertNotSuspended(userId: string): Promise<void> {
  const block = await activeBlock(userId);
  if (block) throw Object.assign(new Error(blockedMessage(block)), { status: 403, code: "ACCOUNT_SUSPENDED" });
}
