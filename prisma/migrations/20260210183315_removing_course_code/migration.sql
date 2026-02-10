/*
  Warnings:

  - You are about to drop the column `code` on the `study_plans` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "study_plans_schoolId_code_key";

-- AlterTable
ALTER TABLE "study_plans" DROP COLUMN "code";
