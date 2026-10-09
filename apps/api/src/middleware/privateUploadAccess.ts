import { prisma } from "../lib/prisma.js";
export async function privateUploadAllowed(storedName: string, user?: { sub: string; role: string }) {
  if (!user) return false;
  if (["admin", "moderator"].includes(user.role)) {
    const actor = await prisma.user.findUnique({ where: { id: user.sub }, select: { role: true } });
    if (actor && ["admin", "moderator"].includes(actor.role)) return true;
  }
  const url = `/uploads/${storedName}`;
  if (await prisma.payout.count({ where: { sellerId: user.sub, status: "COMPLETED", proofUrl: url } })) return true;
  const account = await prisma.paymentAccount.findFirst({ where: { active: true,
    user: { role: { in: ["moderator", "admin"] } }, OR: [{ photoUrl: url }, { qrUrl: url }] } });
  if (!account) return false;
  return await prisma.order.count({ where: { buyerId: user.sub, status: { in: ["PENDING", "ACCEPTED", "PAID"] },
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } }) > 0;
}
