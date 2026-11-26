-- DropIndex
DROP INDEX "habit_metrics_name_key";

-- AlterTable
ALTER TABLE "habit_metrics" ADD COLUMN     "schoolId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "habit_metrics_schoolId_name_key" ON "habit_metrics"("schoolId", "name");

-- AddForeignKey
ALTER TABLE "habit_metrics" ADD CONSTRAINT "habit_metrics_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
