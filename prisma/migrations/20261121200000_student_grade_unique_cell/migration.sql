-- ASM-001 BR .10: one StudentGrade row per (grade, student).
-- Merge duplicates first: keep the most recently updated row, move the others' revisions to it,
-- then delete the others.
CREATE TEMP TABLE "_student_grade_dupes" AS
SELECT "id", "keep_id"
FROM (
  SELECT "id",
         FIRST_VALUE("id") OVER (
           PARTITION BY "gradeId", "studentId"
           ORDER BY "updatedAt" DESC, "id" DESC
         ) AS "keep_id"
  FROM "student_grades"
) ranked
WHERE "id" <> "keep_id";

UPDATE "student_grade_revisions" r
SET "studentGradeId" = d."keep_id"
FROM "_student_grade_dupes" d
WHERE r."studentGradeId" = d."id";

DELETE FROM "student_grades" sg
USING "_student_grade_dupes" d
WHERE sg."id" = d."id";

DROP TABLE "_student_grade_dupes";

-- CreateIndex
CREATE UNIQUE INDEX "student_grades_gradeId_studentId_key" ON "student_grades"("gradeId", "studentId");
