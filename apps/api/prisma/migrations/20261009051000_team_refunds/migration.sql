ALTER TYPE "PayoutStatus" ADD VALUE 'REFUNDED';
ALTER TABLE "Payout" ADD COLUMN "refundProofUrl" TEXT, ADD COLUMN "refundPaymentRef" TEXT, ADD COLUMN "refundedAt" TIMESTAMP(3), ADD COLUMN "refundedById" TEXT;
ALTER TABLE "DocumentAccessGrant" ADD COLUMN "revokedAt" TIMESTAMP(3);
DROP INDEX "DocumentAccessGrant_buyerId_documentId_key";
CREATE INDEX "DocumentAccessGrant_buyerId_documentId_revokedAt_idx" ON "DocumentAccessGrant"("buyerId", "documentId", "revokedAt");
ALTER TYPE "NotificationType" ADD VALUE 'ORDER_REFUNDED';
CREATE UNIQUE INDEX "DocumentAccessGrant_active_buyer_document_key" ON "DocumentAccessGrant"("buyerId", "documentId") WHERE "revokedAt" IS NULL;
