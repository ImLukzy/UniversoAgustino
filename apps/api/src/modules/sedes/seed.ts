import type { PrismaClient } from "@prisma/client";

// Idempotente incluso si el técnico cerró días tras el primer seed.
export async function seedSedes(prisma: PrismaClient) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(300030)::text`;
    if (await tx.auditLog.findFirst({ where: { action: "sedes.seed", entity: "schedule" } })) return { seeded: false };
    for (const [id, name] of [["sede-ingenierias", "Ingenierías"], ["sede-sociales", "Sociales"], ["sede-biomedicas", "Biomédicas"]]) {
      const sede = await tx.sede.upsert({ where: { name }, create: { id, name, address: "", meetingPoint: "" }, update: {} });
      await tx.auditLog.create({ data: { action: "sede.seed", entity: "sede", entityId: sede.id } });
    }
    for (let weekday = 1; weekday <= 6; weekday++) {
      await tx.openingHours.upsert({ where: { weekday }, create: { weekday, opens: 480, closes: weekday === 6 ? 780 : 1080, special: weekday === 6 }, update: {} });
    }
    await tx.auditLog.create({ data: { action: "sedes.seed", entity: "schedule", meta: "Tres sedes y horario inicial; no sobrescribe configuración existente" } });
    return { seeded: true };
  }, { timeout: 30_000 });
}
