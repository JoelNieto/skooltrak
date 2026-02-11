/*
  Warnings:

  - You are about to drop the column `shortName` on the `periods` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "periods" DROP COLUMN "shortName";

-- CreateIndex
CREATE INDEX "periods_year_name_idx" ON "periods"("year", "name");
