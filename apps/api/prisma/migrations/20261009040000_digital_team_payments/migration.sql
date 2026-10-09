ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_VERIFIED';
ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'PAYOUT_PENDING';
ALTER TABLE "Order"
  ADD COLUMN "paymentAccountId" TEXT,
  ADD COLUMN "payHolder" TEXT,
  ADD COLUMN "payPhotoUrl" TEXT,
  ADD COLUMN "sellerPayMethod" TEXT,
  ADD COLUMN "sellerPayDetail" TEXT,
  ADD COLUMN "sellerPayQrUrl" TEXT,
  ADD COLUMN "proofSubmittedAt" TIMESTAMP(3),
  ADD COLUMN "paymentRejectedReason" TEXT,
  ADD COLUMN "paymentReviewedAt" TIMESTAMP(3),
  ADD COLUMN "paymentReviewedById" TEXT,
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD CONSTRAINT "Order_paymentAccountId_fkey" FOREIGN KEY ("paymentAccountId") REFERENCES "PaymentAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Preserve existing seller snapshots before the chosen team account replaces them.
UPDATE "Order" SET "sellerPayMethod" = "payMethod", "sellerPayDetail" = "payDetail", "sellerPayQrUrl" = "payQrUrl";
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'COMPLETED', 'FROZEN');
CREATE TABLE "Payout" (
  "id" TEXT NOT NULL, "orderId" TEXT NOT NULL, "sellerId" TEXT NOT NULL, "collectorId" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL, "feeCents" INTEGER NOT NULL, "netCents" INTEGER NOT NULL,
  "payMethod" TEXT, "payDetail" TEXT, "payQrUrl" TEXT,
  "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING', "dueAt" TIMESTAMP(3) NOT NULL,
  "proofUrl" TEXT, "paymentRef" TEXT, "completedAt" TIMESTAMP(3), "completedById" TEXT, "frozenReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Payout_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Payout_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Payout_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Payout_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Payout_orderId_key" ON "Payout"("orderId");
CREATE INDEX "Payout_collectorId_status_dueAt_idx" ON "Payout"("collectorId", "status", "dueAt");
CREATE INDEX "Payout_sellerId_createdAt_idx" ON "Payout"("sellerId", "createdAt");
CREATE TABLE "DocumentAccessGrant" (
  "id" TEXT NOT NULL, "buyerId" TEXT NOT NULL, "documentId" TEXT NOT NULL, "orderId" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL, "authorId" TEXT NOT NULL, "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentAccessGrant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DocumentAccessGrant_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "DocumentAccessGrant_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "DocumentAccessGrant_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "DocumentAccessGrant_orderId_key" ON "DocumentAccessGrant"("orderId");
CREATE UNIQUE INDEX "DocumentAccessGrant_buyerId_documentId_key" ON "DocumentAccessGrant"("buyerId", "documentId");
