-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'ACCEPTED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "rentalEnd" TIMESTAMP(3),
ADD COLUMN     "rentalStart" TIMESTAMP(3);
