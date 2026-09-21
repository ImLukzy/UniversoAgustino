-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'PAID';

-- AlterTable
ALTER TABLE "BazarItem" ADD COLUMN     "payDetail" TEXT,
ADD COLUMN     "payMethod" TEXT NOT NULL DEFAULT 'YAPE',
ADD COLUMN     "payQrUrl" TEXT;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "payDetail" TEXT,
ADD COLUMN     "payMethod" TEXT NOT NULL DEFAULT 'YAPE',
ADD COLUMN     "payQrUrl" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "payDetail" TEXT,
ADD COLUMN     "payMethod" TEXT,
ADD COLUMN     "payProof" TEXT,
ADD COLUMN     "payQrUrl" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PENDING';
