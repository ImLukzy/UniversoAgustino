-- Spec 30: aditiva; sin modificar tablas ni datos del marketplace.
CREATE TABLE "Sede" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "address" TEXT NOT NULL DEFAULT '',
  "meetingPoint" TEXT NOT NULL DEFAULT '', "photoUrl" TEXT, "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Sede_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Sede_name_key" ON "Sede"("name");
CREATE TABLE "OpeningHours" (
  "weekday" INTEGER NOT NULL, "opens" INTEGER NOT NULL, "closes" INTEGER NOT NULL,
  "special" BOOLEAN NOT NULL DEFAULT false, CONSTRAINT "OpeningHours_pkey" PRIMARY KEY ("weekday"),
  CONSTRAINT "OpeningHours_day_check" CHECK ("weekday" BETWEEN 0 AND 6),
  CONSTRAINT "OpeningHours_interval_check" CHECK ("opens" >= 0 AND "closes" <= 1440 AND "opens" < "closes")
);
CREATE TABLE "Holiday" (
  "id" TEXT NOT NULL, "date" DATE NOT NULL, "reason" TEXT NOT NULL,
  CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Holiday_date_key" ON "Holiday"("date");
CREATE TABLE "StaffShift" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "sedeId" TEXT NOT NULL,
  "weekday" INTEGER NOT NULL, "startsMin" INTEGER NOT NULL, "endsMin" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StaffShift_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StaffShift_day_check" CHECK ("weekday" BETWEEN 0 AND 6),
  CONSTRAINT "StaffShift_interval_check" CHECK ("startsMin" >= 0 AND "endsMin" <= 1440 AND "startsMin" < "endsMin"),
  CONSTRAINT "StaffShift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "StaffShift_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "StaffShift_userId_weekday_idx" ON "StaffShift"("userId", "weekday");
CREATE INDEX "StaffShift_sedeId_weekday_idx" ON "StaffShift"("sedeId", "weekday");
