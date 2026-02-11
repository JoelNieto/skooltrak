/*
  Warnings:

  - You are about to drop the column `schoolId` on the `periods` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "periods" DROP CONSTRAINT "periods_schoolId_fkey";

-- AlterTable
ALTER TABLE "periods" DROP COLUMN "schoolId";
