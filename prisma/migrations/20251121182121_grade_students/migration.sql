-- DropForeignKey
ALTER TABLE "public"."GradeStudent" DROP CONSTRAINT "GradeStudent_gradeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GradeStudent" DROP CONSTRAINT "GradeStudent_studentId_fkey";

-- AddForeignKey
ALTER TABLE "GradeStudent" ADD CONSTRAINT "GradeStudent_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeStudent" ADD CONSTRAINT "GradeStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
