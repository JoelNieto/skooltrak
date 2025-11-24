-- DropForeignKey
ALTER TABLE "public"."Degree" DROP CONSTRAINT "Degree_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GradeStudent" DROP CONSTRAINT "GradeStudent_studentId_fkey";

-- AddForeignKey
ALTER TABLE "Degree" ADD CONSTRAINT "Degree_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeStudent" ADD CONSTRAINT "GradeStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
