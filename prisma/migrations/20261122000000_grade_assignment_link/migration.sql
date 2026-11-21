-- ASM-001-S06: a grade column can be linked to one of its course's assignments (BR .11).
-- AlterTable
ALTER TABLE "grades" ADD COLUMN "assignmentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "grades_assignmentId_key" ON "grades"("assignmentId");

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
