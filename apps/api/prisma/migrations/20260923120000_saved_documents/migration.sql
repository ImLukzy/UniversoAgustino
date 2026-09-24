-- Guardados del Visor (spec 06): bookmark usuario+documento.
CREATE TABLE "SavedDocument" (
    "userId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedDocument_pkey" PRIMARY KEY ("userId","documentId")
);

CREATE INDEX "SavedDocument_userId_createdAt_idx" ON "SavedDocument"("userId", "createdAt");

ALTER TABLE "SavedDocument" ADD CONSTRAINT "SavedDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SavedDocument" ADD CONSTRAINT "SavedDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
