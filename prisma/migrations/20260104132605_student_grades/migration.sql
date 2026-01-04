/*
  Warnings:

  - You are about to drop the `GradeStudent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GradeStudentRevision` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "GradeStudent" DROP CONSTRAINT "GradeStudent_gradeId_fkey";

-- DropForeignKey
ALTER TABLE "GradeStudent" DROP CONSTRAINT "GradeStudent_studentId_fkey";

-- DropForeignKey
ALTER TABLE "GradeStudentRevision" DROP CONSTRAINT "GradeStudentRevision_gradeStudentId_fkey";

-- AlterTable
ALTER TABLE "ClassGroupWeeklySchedule" ADD COLUMN     "recess" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "GradeStudent";

-- DropTable
DROP TABLE "GradeStudentRevision";

-- CreateTable
CREATE TABLE "StudentGrade" (
    "id" TEXT NOT NULL,
    "comments" TEXT,
    "gradeId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentGradeRevision" (
    "id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "studentGradeId" TEXT NOT NULL,
    "score" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentGradeRevision_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StudentGrade" ADD CONSTRAINT "StudentGrade_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGrade" ADD CONSTRAINT "StudentGrade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGradeRevision" ADD CONSTRAINT "StudentGradeRevision_studentGradeId_fkey" FOREIGN KEY ("studentGradeId") REFERENCES "StudentGrade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
