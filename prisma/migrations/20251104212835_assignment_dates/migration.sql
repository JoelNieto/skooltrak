/*
  Warnings:

  - You are about to drop the `AssigmentDate` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[organizationId,name,code]` on the table `Subject` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."AssigmentDate" DROP CONSTRAINT "AssigmentDate_assignmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AssigmentDate" DROP CONSTRAINT "AssigmentDate_classGroupId_fkey";

-- DropIndex
DROP INDEX "public"."Subject_name_code_key";

-- DropTable
DROP TABLE "public"."AssigmentDate";

-- CreateTable
CREATE TABLE "AssignmentDate" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "classGroupId" TEXT NOT NULL,

    CONSTRAINT "AssignmentDate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subject_organizationId_name_code_key" ON "Subject"("organizationId", "name", "code");

-- AddForeignKey
ALTER TABLE "AssignmentDate" ADD CONSTRAINT "AssignmentDate_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentDate" ADD CONSTRAINT "AssignmentDate_classGroupId_fkey" FOREIGN KEY ("classGroupId") REFERENCES "ClassGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
