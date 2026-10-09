ALTER TABLE "Upload" ADD COLUMN "private" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE "PaymentAccount" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "method" TEXT NOT NULL,
  "holder" TEXT NOT NULL, "number" TEXT NOT NULL, "photoUrl" TEXT NOT NULL, "qrUrl" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentAccount_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PaymentAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "PaymentAccount_userId_active_idx" ON "PaymentAccount"("userId", "active");
