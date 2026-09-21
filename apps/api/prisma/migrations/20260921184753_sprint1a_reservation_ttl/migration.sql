-- Sprint 1A: reservas con TTL, vendedor materializado y snapshot de pedido.
-- itemType vive en MINÚSCULAS ('document' | 'bazar') según CreateOrderSchema.
-- Usar 'DOCUMENT'/'BAZAR' aquí no coincidiría con ninguna fila.

-- (1) Columnas nuevas, todas NULLABLE para poder rellenarlas.
ALTER TABLE "Order" ADD COLUMN "sellerId" TEXT;
ALTER TABLE "Order" ADD COLUMN "expiresAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "acceptedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "cancelledReason" TEXT;
ALTER TABLE "Order" ADD COLUMN "itemTitle" TEXT;
ALTER TABLE "Order" ADD COLUMN "itemPriceCents" INTEGER;
ALTER TABLE "Order" ADD COLUMN "feeBps" INTEGER;

-- (2) Backfill del vendedor desde el dueño real del ítem.
UPDATE "Order" o SET "sellerId" = d."authorId"
  FROM "Document" d
 WHERE o."itemType" = 'document' AND o."itemId" = d."id" AND o."sellerId" IS NULL;

UPDATE "Order" o SET "sellerId" = b."sellerId"
  FROM "BazarItem" b
 WHERE o."itemType" = 'bazar' AND o."itemId" = b."id" AND o."sellerId" IS NULL;

-- (3) Pedidos cuyo ítem ya no existe: marcador + motivo para revisión manual.
-- Si el chequeo previo de F0-02 devolvió 0 huérfanos, este UPDATE no toca nada.
UPDATE "Order"
   SET "sellerId" = "buyerId",
       "cancelledReason" = COALESCE("cancelledReason", 'ORPHAN_ITEM')
 WHERE "sellerId" IS NULL;

ALTER TABLE "Order" ALTER COLUMN "sellerId" SET NOT NULL;
ALTER TABLE "Order" ADD CONSTRAINT "Order_sellerId_fkey"
  FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- (4) Backfill del snapshot (título + precio vigentes al crear el pedido).
UPDATE "Order" o
   SET "itemTitle" = d."title", "itemPriceCents" = d."priceCents"
  FROM "Document" d
 WHERE o."itemType" = 'document' AND o."itemId" = d."id" AND o."itemTitle" IS NULL;

UPDATE "Order" o
   SET "itemTitle" = b."title", "itemPriceCents" = b."priceCents"
  FROM "BazarItem" b
 WHERE o."itemType" = 'bazar' AND o."itemId" = b."id" AND o."itemTitle" IS NULL;

UPDATE "Order" SET "itemTitle" = '(publicación eliminada)' WHERE "itemTitle" IS NULL;
UPDATE "Order" SET "itemPriceCents" = COALESCE("itemPriceCents", "amountCents", 0)
 WHERE "itemPriceCents" IS NULL;
UPDATE "Order"
   SET "feeBps" = CASE
     WHEN "amountCents" > 0 THEN CAST(ROUND("feeCents" * 10000.0 / "amountCents") AS INTEGER)
     ELSE 1300 END
 WHERE "feeBps" IS NULL;

ALTER TABLE "Order" ALTER COLUMN "itemTitle" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "itemPriceCents" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "feeBps" SET NOT NULL;

-- (5) Reservas huérfanas antiguas → CANCELLED antes de crear el índice único.
UPDATE "Order"
   SET "status" = 'CANCELLED', "cancelledAt" = NOW(),
       "cancelledReason" = COALESCE("cancelledReason", 'TTL_BACKFILL'), "expiresAt" = NULL
 WHERE "status" = 'PENDING' AND "createdAt" < NOW() - INTERVAL '30 minutes';

-- (6) Un solo pedido vivo por ítem. Prisma no expresa índices parciales:
-- la carrera entre dos POST concurrentes termina en P2002 → 409 NOT_AVAILABLE.
CREATE UNIQUE INDEX "order_active_item_unique"
  ON "Order" ("itemType", "itemId")
  WHERE "status" IN ('PENDING', 'ACCEPTED', 'PAID', 'ESCROW');

CREATE INDEX "order_status_expires_idx" ON "Order" ("status", "expiresAt");
CREATE INDEX "order_seller_created_idx" ON "Order" ("sellerId", "createdAt" DESC);
