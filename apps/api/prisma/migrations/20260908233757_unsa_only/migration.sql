-- DropIndex
DROP INDEX "Document_university_course_status_idx";

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "career" TEXT NOT NULL DEFAULT 'ENFERMERIA',
ALTER COLUMN "university" SET DEFAULT 'UNSA';

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "career" TEXT NOT NULL DEFAULT 'ENFERMERIA';

-- CreateIndex
CREATE INDEX "Document_university_career_status_idx" ON "Document"("university", "career", "status");
