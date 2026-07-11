-- DropIndex
DROP INDEX "parents_userId_key";

-- AlterTable
ALTER TABLE "students" ALTER COLUMN "enrollmentCodeGeneratedAt" SET DEFAULT CURRENT_TIMESTAMP;
