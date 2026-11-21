-- ASM-001-S05: excused cells (BR .3). An excused cell has no score.
-- AlterTable
ALTER TABLE "student_grades" ADD COLUMN "excused" BOOLEAN NOT NULL DEFAULT false;
