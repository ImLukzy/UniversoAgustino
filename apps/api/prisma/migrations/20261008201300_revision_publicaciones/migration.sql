CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "Document"
  ADD COLUMN "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN "reviewNote" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "reviewedById" TEXT;

ALTER TABLE "BazarItem"
  ADD COLUMN "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN "reviewNote" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "reviewedById" TEXT;

ALTER TYPE "NotificationType" ADD VALUE 'REVIEW_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'REVIEW_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'STAFF_ADDED';
ALTER TYPE "NotificationType" ADD VALUE 'STAFF_REMOVED';

CREATE INDEX "Document_reviewStatus_createdAt_idx" ON "Document"("reviewStatus", "createdAt");
CREATE INDEX "BazarItem_reviewStatus_createdAt_idx" ON "BazarItem"("reviewStatus", "createdAt");
