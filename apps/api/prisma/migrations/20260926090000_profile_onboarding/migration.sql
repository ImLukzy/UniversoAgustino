-- Onboarding obligatorio de primer ingreso (spec 21): facultad, celular y
-- fecha de perfil completo. Aditiva: los perfiles existentes se marcan como
-- completos para no bloquear a quien ya usaba la plataforma.
ALTER TABLE "Profile" ADD COLUMN "faculty" TEXT;
ALTER TABLE "Profile" ADD COLUMN "phone" TEXT;
ALTER TABLE "Profile" ADD COLUMN "onboardedAt" TIMESTAMP(3);
UPDATE "Profile" SET "onboardedAt" = CURRENT_TIMESTAMP;
