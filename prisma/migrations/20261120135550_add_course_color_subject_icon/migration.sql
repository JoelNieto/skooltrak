-- CreateEnum
CREATE TYPE "CourseColor" AS ENUM ('INDIGO', 'TEAL', 'ROSE', 'VIOLET', 'AMBER', 'SLATE', 'FUCHSIA', 'GREEN');

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "color" "CourseColor";

-- AlterTable
ALTER TABLE "subjects" ADD COLUMN     "icon" TEXT;
