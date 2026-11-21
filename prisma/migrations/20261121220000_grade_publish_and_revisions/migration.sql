-- ASM-001-S04: who published a grade column and when (BR .9), and revisions of published scores (BR .8).

-- AlterTable
ALTER TABLE "grades" ADD COLUMN "publishedAt" TIMESTAMP(3),
ADD COLUMN "publishedById" TEXT;

-- Existing published columns: their last update is the best guess at when they were published.
UPDATE "grades" SET "publishedAt" = "updatedAt" WHERE "published" = true;

-- AlterTable
ALTER TABLE "student_grade_revisions" ADD COLUMN "changedById" TEXT,
ADD COLUMN "excused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "previousScore" DECIMAL(65,30),
ALTER COLUMN "score" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "student_grade_revisions_studentGradeId_createdAt_idx" ON "student_grade_revisions"("studentGradeId", "createdAt");

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_grade_revisions" ADD CONSTRAINT "student_grade_revisions_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
