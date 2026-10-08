-- AlterTable
ALTER TABLE "HandoverCase" ADD COLUMN     "backToSellerRequestedAt" TIMESTAMP(3),
ADD COLUMN     "returnCondition" TEXT,
ADD COLUMN     "returnConditionNote" TEXT,
ADD COLUMN     "returnDeadlineAt" TIMESTAMP(3),
ADD COLUMN     "returnPhotoUrl" TEXT,
ADD COLUMN     "returnWindowStart" TIMESTAMP(3),
ADD COLUMN     "returnedAt" TIMESTAMP(3),
ADD COLUMN     "sellerConfirmedAt" TIMESTAMP(3);

