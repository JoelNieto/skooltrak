/*
  Warnings:

  - You are about to drop the `_ClassGroupToCourse` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ClassGroupToCourse" DROP CONSTRAINT "_ClassGroupToCourse_A_fkey";

-- DropForeignKey
ALTER TABLE "_ClassGroupToCourse" DROP CONSTRAINT "_ClassGroupToCourse_B_fkey";

-- DropTable
DROP TABLE "_ClassGroupToCourse";
