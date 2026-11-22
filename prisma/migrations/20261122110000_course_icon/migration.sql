-- ACA-001-S09: the teacher's icon for a course (FR .3); null shows the subject's icon.

-- AlterTable
ALTER TABLE "courses" ADD COLUMN "icon" TEXT;
