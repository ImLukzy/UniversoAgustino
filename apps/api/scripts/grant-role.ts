import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { RoleSchema, StaffMemberSchema } from "@hub/shared";

// Operación manual de arranque; producción requiere autorización del humano.
const [emailArg, roleArg] = process.argv.slice(2);
const { email } = StaffMemberSchema.parse({ email: emailArg });
const role = RoleSchema.parse(roleArg);
if (role === "creator") throw new Error("Uso: staff:grant <correo> admin|moderator|student");
const prisma = new PrismaClient();
try {
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({ where: { email }, data: { role } });
    await tx.refreshToken.updateMany({ where: { userId: user.id, revoked: false }, data: { revoked: true } });
    await tx.auditLog.create({ data: { action: "staff.grant", entity: "user", entityId: user.id, meta: role } });
  });
  console.log(`${email} ${role}`);
} catch {
  console.error("No se pudo cambiar el rol; revisa el correo y DATABASE_URL.");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
