/*
  Warnings:

  - You are about to drop the `Payout` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Review` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Payout" DROP CONSTRAINT "Payout_creatorId_fkey";

-- DropTable
DROP TABLE "Payout";

-- DropTable
DROP TABLE "Review";
