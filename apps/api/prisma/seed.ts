import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.order.deleteMany();
  await prisma.report.deleteMany();
  await prisma.bazarItem.deleteMany();
  await prisma.document.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  // Comunidad UNSA: solo correos @unsa.edu.pe (+ excepción autorizada).
  const admin = await prisma.user.create({
    data: {
      email: "admin@unsa.edu.pe",
      passwordHash: await bcrypt.hash("Admin1234!", 12),
      role: "admin",
      profile: { create: { fullName: "Admin Hub", university: "UNSA", career: "ENFERMERIA", cycle: "X" } },
    },
  });

  const creator = await prisma.user.create({
    data: {
      email: "rosa.quispe@unsa.edu.pe",
      passwordHash: await bcrypt.hash("Creadora123!", 12),
      role: "creator",
      profile: { create: { fullName: "Rosa Quispe", university: "UNSA", career: "ENFERMERIA", cycle: "VI", hospital: "Honorio Delgado", cepVerified: true } },
    },
  });

  // Acceso del propietario (excepción autorizada fuera de @unsa.edu.pe).
  const owner = await prisma.user.create({
    data: {
      email: "lukas.melgar@tecsup.edu.pe",
      passwordHash: await bcrypt.hash("Lukas123!", 12),
      role: "admin",
      profile: { create: { fullName: "Lukas Melgar", university: "UNSA", career: "ENFERMERIA", cycle: "VI" } },
    },
  });

  // DB vacía por defecto: solo usuarios (sin apuntes/bazar predeterminados).
  // Cada cuenta empieza sin nada y el usuario crea su propio contenido desde la web.
  console.log(`Seed OK (vacío). admin=${admin.email} creator=${creator.email} owner=${owner.email}`);
}

main().finally(() => prisma.$disconnect());
