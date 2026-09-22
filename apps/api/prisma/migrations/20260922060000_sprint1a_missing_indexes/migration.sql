-- Correctiva: los índices order_status_expires_idx y order_seller_created_idx
-- figuran en la migración sprint1a_reservation_ttl (aplicada y con checksum
-- válido) pero no existen en la base (verificado en pg_indexes el 2026-09-22).
-- Se recrean aquí con IF NOT EXISTS; nunca se edita una migración aplicada.
CREATE INDEX IF NOT EXISTS "order_status_expires_idx" ON "Order" ("status", "expiresAt");
CREATE INDEX IF NOT EXISTS "order_seller_created_idx" ON "Order" ("sellerId", "createdAt" DESC);
