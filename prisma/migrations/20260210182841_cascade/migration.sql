-- DropForeignKey
ALTER TABLE "class_groups" DROP CONSTRAINT "class_groups_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "class_groups" DROP CONSTRAINT "class_groups_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "class_groups" DROP CONSTRAINT "class_groups_studyPlanId_fkey";

-- DropForeignKey
ALTER TABLE "grades" DROP CONSTRAINT "grades_bucketId_fkey";

-- DropForeignKey
ALTER TABLE "grades" DROP CONSTRAINT "grades_courseId_fkey";

-- DropForeignKey
ALTER TABLE "grades" DROP CONSTRAINT "grades_periodId_fkey";

-- DropForeignKey
ALTER TABLE "newsletters" DROP CONSTRAINT "newsletters_authorId_fkey";

-- DropForeignKey
ALTER TABLE "newsletters" DROP CONSTRAINT "newsletters_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "newsletters" DROP CONSTRAINT "newsletters_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "parents" DROP CONSTRAINT "parents_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "periods" DROP CONSTRAINT "periods_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "quiz_question_options" DROP CONSTRAINT "quiz_question_options_questionId_fkey";

-- DropForeignKey
ALTER TABLE "quiz_questions" DROP CONSTRAINT "quiz_questions_quizId_fkey";

-- DropForeignKey
ALTER TABLE "quiz_schedules" DROP CONSTRAINT "quiz_schedules_classGroupId_fkey";

-- DropForeignKey
ALTER TABLE "quiz_schedules" DROP CONSTRAINT "quiz_schedules_quizId_fkey";

-- DropForeignKey
ALTER TABLE "quizzes" DROP CONSTRAINT "quizzes_courseId_fkey";

-- DropForeignKey
ALTER TABLE "quizzes" DROP CONSTRAINT "quizzes_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "quizzes" DROP CONSTRAINT "quizzes_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "schools" DROP CONSTRAINT "schools_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "student_grade_revisions" DROP CONSTRAINT "student_grade_revisions_studentGradeId_fkey";

-- DropForeignKey
ALTER TABLE "student_grades" DROP CONSTRAINT "student_grades_studentId_fkey";

-- DropForeignKey
ALTER TABLE "study_plans" DROP CONSTRAINT "study_plans_degreeId_fkey";

-- DropForeignKey
ALTER TABLE "study_plans" DROP CONSTRAINT "study_plans_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "subjects" DROP CONSTRAINT "subjects_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "teachers" DROP CONSTRAINT "teachers_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "teachers" DROP CONSTRAINT "teachers_userId_fkey";

-- AlterTable
ALTER TABLE "newsletters" ALTER COLUMN "authorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "quizzes" ALTER COLUMN "teacherId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "schools" ADD CONSTRAINT "schools_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "periods" ADD CONSTRAINT "periods_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_degreeId_fkey" FOREIGN KEY ("degreeId") REFERENCES "degrees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_groups" ADD CONSTRAINT "class_groups_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_groups" ADD CONSTRAINT "class_groups_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_groups" ADD CONSTRAINT "class_groups_studyPlanId_fkey" FOREIGN KEY ("studyPlanId") REFERENCES "study_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parents" ADD CONSTRAINT "parents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_question_options" ADD CONSTRAINT "quiz_question_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "quiz_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_schedules" ADD CONSTRAINT "quiz_schedules_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_schedules" ADD CONSTRAINT "quiz_schedules_classGroupId_fkey" FOREIGN KEY ("classGroupId") REFERENCES "class_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_bucketId_fkey" FOREIGN KEY ("bucketId") REFERENCES "grade_buckets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_grade_revisions" ADD CONSTRAINT "student_grade_revisions_studentGradeId_fkey" FOREIGN KEY ("studentGradeId") REFERENCES "student_grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsletters" ADD CONSTRAINT "newsletters_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsletters" ADD CONSTRAINT "newsletters_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsletters" ADD CONSTRAINT "newsletters_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
