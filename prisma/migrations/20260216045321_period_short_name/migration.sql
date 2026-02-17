-- AlterTable
ALTER TABLE "periods" ADD COLUMN     "shortName" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "periods_year_shortName_idx" ON "periods"("year", "shortName");
