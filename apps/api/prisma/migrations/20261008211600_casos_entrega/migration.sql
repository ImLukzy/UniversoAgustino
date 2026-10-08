-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('UNASSIGNED', 'ASSIGNED', 'DROP_SCHEDULED', 'IN_CUSTODY', 'PICKUP_SCHEDULED', 'DELIVERED', 'RENTED_OUT', 'RETURN_SCHEDULED', 'RETURNED', 'BACK_TO_SELLER', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AppointmentKind" AS ENUM ('DROP_OFF', 'PICKUP', 'RETURN', 'BACK_TO_SELLER');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'DONE', 'NO_SHOW', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'ORDER_CASE_ASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE 'ORDER_APPOINTMENT_SCHEDULED';
ALTER TYPE "NotificationType" ADD VALUE 'ORDER_APPOINTMENT_NO_SHOW';
ALTER TYPE "NotificationType" ADD VALUE 'ORDER_IN_CUSTODY';
ALTER TYPE "NotificationType" ADD VALUE 'ORDER_PICKUP_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE 'ORDER_RETURN_COMPLETED';

-- CreateTable
CREATE TABLE "HandoverCase" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "status" "CaseStatus" NOT NULL DEFAULT 'UNASSIGNED',
    "sedeId" TEXT,
    "receivedPhotoUrl" TEXT,
    "conditionNote" TEXT,
    "receivedAt" TIMESTAMP(3),
    "paymentRef" TEXT,
    "paymentMethod" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HandoverCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "kind" "AppointmentKind" NOT NULL,
    "partyId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "sedeId" TEXT NOT NULL,
    "shiftId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "rescheduledFromId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HandoverCase_orderId_key" ON "HandoverCase"("orderId");

-- CreateIndex
CREATE INDEX "HandoverCase_assigneeId_status_createdAt_idx" ON "HandoverCase"("assigneeId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_rescheduledFromId_key" ON "Appointment"("rescheduledFromId");

-- CreateIndex
CREATE INDEX "Appointment_staffId_status_startsAt_idx" ON "Appointment"("staffId", "status", "startsAt");

-- CreateIndex
CREATE INDEX "Appointment_caseId_kind_idx" ON "Appointment"("caseId", "kind");

-- AddForeignKey
ALTER TABLE "HandoverCase" ADD CONSTRAINT "HandoverCase_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverCase" ADD CONSTRAINT "HandoverCase_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverCase" ADD CONSTRAINT "HandoverCase_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "HandoverCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "StaffShift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_rescheduledFromId_fkey" FOREIGN KEY ("rescheduledFromId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


CREATE UNIQUE INDEX "appointment_scheduled_case_kind_unique" ON "Appointment"("caseId", "kind") WHERE "status" = 'SCHEDULED';
ALTER TABLE "Appointment" ADD CONSTRAINT "appointment_interval_check" CHECK ("endsAt" > "startsAt");
