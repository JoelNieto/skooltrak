-- DropForeignKey
ALTER TABLE "courses" DROP CONSTRAINT "courses_currentPeriodId_fkey";

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "currentPeriodId";
