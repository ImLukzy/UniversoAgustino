ALTER TABLE "Order" ADD COLUMN "physicalClosedAt" TIMESTAMP(3);
CREATE INDEX "Order_itemType_payMethod_verifiedAt_idx" ON "Order"("itemType", "payMethod", "verifiedAt");
DROP INDEX "order_active_item_unique";
CREATE UNIQUE INDEX "order_active_item_unique" ON "Order"("itemType", "itemId")
WHERE "itemType" = 'bazar' AND "physicalClosedAt" IS NULL
AND "status" IN ('PENDING', 'ACCEPTED', 'PAID', 'ESCROW');
