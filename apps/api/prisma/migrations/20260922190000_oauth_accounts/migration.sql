-- Cuentas OAuth (Google/Apple): proveedor vinculado + contraseña local
-- opcional. Sin tocar los índices raw de sprint1a (drift conocido: viven
-- solo en SQL, no en el schema; este diff los excluye a propósito).
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "providerId" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- Búsqueda por proveedor (NULLs distintos entre sí: cuentas con clave intactas).
CREATE UNIQUE INDEX "User_provider_providerId_key" ON "User"("provider", "providerId");
