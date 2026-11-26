-- AlterTable
ALTER TABLE "periods" ADD COLUMN     "schoolId" TEXT;

-- CreateIndex
CREATE INDEX "periods_schoolId_year_idx" ON "periods"("schoolId", "year");

-- AddForeignKey
ALTER TABLE "periods" ADD CONSTRAINT "periods_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
