-- CreateIndex
CREATE INDEX "BazarItem_sellerId_idx" ON "BazarItem"("sellerId");

-- CreateIndex
CREATE INDEX "Document_authorId_idx" ON "Document"("authorId");

-- CreateIndex
CREATE INDEX "Order_itemId_createdAt_idx" ON "Order"("itemId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Order_buyerId_status_idx" ON "Order"("buyerId", "status");
