-- Voucher opcional del comprador (spec 09): ruta /uploads/<uuid>.
ALTER TABLE "Order" ADD COLUMN "payProofUrl" TEXT;
