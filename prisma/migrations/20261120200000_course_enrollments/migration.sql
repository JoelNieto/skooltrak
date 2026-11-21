-- ACA-001-S11: an explicit course roster replaces the implicit Course <-> Student link.
-- Order matters: create the roster, backfill it from the plan rule and the old link, then drop
-- the old link.

-- CreateEnum
CREATE TYPE "EnrollmentSource" AS ENUM ('PLAN', 'MANUAL');

-- CreateTable
CREATE TABLE "course_enrollments" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "source" "EnrollmentSource" NOT NULL,
    "excluded" BOOLEAN NOT NULL DEFAULT false,
    "addedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_enrollments_studentId_idx" ON "course_enrollments"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "course_enrollments_courseId_studentId_key" ON "course_enrollments"("courseId", "studentId");

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill 1 (BR-ACA-001.15, plan rule): every student whose class group's study plan holds the
-- course, in the same organization. This also enrolls students created by CSV import, which never
-- got the old link.
INSERT INTO "course_enrollments" ("id", "courseId", "studentId", "source", "excluded", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, c."id", s."id", 'PLAN', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "students" s
JOIN "class_groups" g ON g."id" = s."classGroupId"
JOIN "courses" c ON c."studyPlanId" = g."studyPlanId" AND c."organizationId" = s."organizationId"
ON CONFLICT ("courseId", "studentId") DO NOTHING;

-- Backfill 2 (decided 2026-11-20): an old link the plan rule doesn't cover (a course outside the
-- student's current plan) is kept as MANUAL, so no student loses a course they can see today.
-- "_CourseToStudent"."A" is the course, "B" the student.
DO $$
DECLARE
  kept integer;
BEGIN
  INSERT INTO "course_enrollments" ("id", "courseId", "studentId", "source", "excluded", "createdAt", "updatedAt")
  SELECT gen_random_uuid()::text, l."A", l."B", 'MANUAL', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM "_CourseToStudent" l
  ON CONFLICT ("courseId", "studentId") DO NOTHING;
  GET DIAGNOSTICS kept = ROW_COUNT;
  RAISE NOTICE 'course_enrollments backfill: % stored link(s) outside the plan rule kept as MANUAL', kept;
END $$;

-- DropForeignKey
ALTER TABLE "_CourseToStudent" DROP CONSTRAINT "_CourseToStudent_A_fkey";

-- DropForeignKey
ALTER TABLE "_CourseToStudent" DROP CONSTRAINT "_CourseToStudent_B_fkey";

-- DropTable
DROP TABLE "_CourseToStudent";
