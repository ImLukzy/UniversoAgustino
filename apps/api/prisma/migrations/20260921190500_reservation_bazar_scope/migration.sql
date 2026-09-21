-- Sprint 1A (corrección): el índice único de reserva viva aplica SOLO a bazar
-- (ítem físico único). Los documentos digitales admiten N pedidos vivos de
-- N compradores; con el índice anterior, la segunda compra de un apunte
-- habría fallado con 409.
DROP INDEX IF EXISTS "order_active_item_unique";

CREATE UNIQUE INDEX "order_active_item_unique"
  ON "Order" ("itemType", "itemId")
  WHERE "status" IN ('PENDING', 'ACCEPTED', 'PAID', 'ESCROW')
    AND "itemType" = 'bazar';
