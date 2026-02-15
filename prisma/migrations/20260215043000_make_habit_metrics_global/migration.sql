-- DropForeignKey
ALTER TABLE "habit_metrics" DROP CONSTRAINT "habit_metrics_organizationId_fkey";

-- DropIndex
DROP INDEX "habit_metrics_organizationId_active_idx";

-- DropIndex
DROP INDEX "habit_metrics_organizationId_name_key";

-- AlterTable
ALTER TABLE "habit_metrics" DROP COLUMN "organizationId";

-- CreateIndex
CREATE INDEX "habit_metrics_active_idx" ON "habit_metrics"("active");

-- CreateIndex
CREATE UNIQUE INDEX "habit_metrics_name_key" ON "habit_metrics"("name");
