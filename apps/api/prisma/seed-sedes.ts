import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { seedSedes } from "../src/modules/sedes/seed.js";

// Solo god ejecuta: dev autorizado; producción requiere OK humano.
const prisma = new PrismaClient();
try {
  console.log(await seedSedes(prisma));
} finally {
  await prisma.$disconnect();
}
