-- Study plans inherit their grade metric and financial settings from their degree (level);
-- a plan's own non-null value (or its own enrollment costs) overrides the degree's.
-- Tuition months become a start-end range.

-- AlterTable
ALTER TABLE "degrees" ADD COLUMN     "gradeMetricId" TEXT,
ADD COLUMN     "monthlyTuitionAmount" DECIMAL(65,30),
ADD COLUMN     "tuitionEndMonth" INTEGER,
ADD COLUMN     "tuitionStartMonth" INTEGER;

-- AlterTable
ALTER TABLE "study_plans" ADD COLUMN     "tuitionEndMonth" INTEGER,
ADD COLUMN     "tuitionStartMonth" INTEGER,
ALTER COLUMN "description" SET DEFAULT '';

-- CreateTable
CREATE TABLE "degree_enrollment_costs" (
    "id" TEXT NOT NULL,
    "degreeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "degree_enrollment_costs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "degree_enrollment_costs_degreeId_idx" ON "degree_enrollment_costs"("degreeId");

-- AddForeignKey
ALTER TABLE "degrees" ADD CONSTRAINT "degrees_gradeMetricId_fkey" FOREIGN KEY ("gradeMetricId") REFERENCES "grade_metrics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "degree_enrollment_costs" ADD CONSTRAINT "degree_enrollment_costs_degreeId_fkey" FOREIGN KEY ("degreeId") REFERENCES "degrees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data: tuition months -> range. Months are ordered from the school's year start, so a plan that
-- billed Aug..Dec + Jan..May (start month 8) becomes Aug -> May. Gaps inside the old set are filled.
UPDATE "study_plans" sp
SET "tuitionStartMonth" = r.s, "tuitionEndMonth" = r.e
FROM (
  SELECT p.id,
    (array_agg(m ORDER BY (m - sc."schoolYearStartMonth" + 12) % 12 ASC))[1] AS s,
    (array_agg(m ORDER BY (m - sc."schoolYearStartMonth" + 12) % 12 DESC))[1] AS e
  FROM "study_plans" p
  JOIN "schools" sc ON sc.id = p."schoolId"
  CROSS JOIN LATERAL unnest(p."tuitionMonths") AS m
  WHERE m BETWEEN 1 AND 12
  GROUP BY p.id
) r
WHERE sp.id = r.id;

-- Data: lift a setting to the degree when every plan of the degree shares it, then clear the
-- plans' copies so they inherit. Plans that differ keep their own value as an override.
WITH shared AS (
  SELECT "degreeId", MIN("gradeMetricId") AS v
  FROM "study_plans" GROUP BY "degreeId"
  HAVING COUNT(*) = COUNT("gradeMetricId") AND COUNT(DISTINCT "gradeMetricId") = 1
), lifted AS (
  UPDATE "degrees" d SET "gradeMetricId" = shared.v FROM shared WHERE d.id = shared."degreeId" RETURNING d.id
)
UPDATE "study_plans" SET "gradeMetricId" = NULL WHERE "degreeId" IN (SELECT id FROM lifted);

WITH shared AS (
  SELECT "degreeId", MIN("monthlyTuitionAmount") AS v
  FROM "study_plans" GROUP BY "degreeId"
  HAVING COUNT(*) = COUNT("monthlyTuitionAmount") AND COUNT(DISTINCT "monthlyTuitionAmount") = 1
), lifted AS (
  UPDATE "degrees" d SET "monthlyTuitionAmount" = shared.v FROM shared WHERE d.id = shared."degreeId" RETURNING d.id
)
UPDATE "study_plans" SET "monthlyTuitionAmount" = NULL WHERE "degreeId" IN (SELECT id FROM lifted);

WITH shared AS (
  SELECT "degreeId", MIN("tuitionStartMonth") AS s, MIN("tuitionEndMonth") AS e
  FROM "study_plans" GROUP BY "degreeId"
  HAVING COUNT(*) = COUNT("tuitionStartMonth")
     AND COUNT(DISTINCT ("tuitionStartMonth", "tuitionEndMonth")) = 1
), lifted AS (
  UPDATE "degrees" d SET "tuitionStartMonth" = shared.s, "tuitionEndMonth" = shared.e
  FROM shared WHERE d.id = shared."degreeId" RETURNING d.id
)
UPDATE "study_plans" SET "tuitionStartMonth" = NULL, "tuitionEndMonth" = NULL
WHERE "degreeId" IN (SELECT id FROM lifted);

-- Enrollment costs: lifted when every plan of the degree has the same, non-empty list.
CREATE TEMP TABLE "_plan_cost_sig" AS
SELECT p.id AS "planId", p."degreeId",
  (SELECT string_agg(c."name" || E'\x1f' || c."amount"::text, E'\x1e' ORDER BY c."order", c."name")
     FROM "study_plan_enrollment_costs" c WHERE c."studyPlanId" = p.id) AS sig
FROM "study_plans" p;

CREATE TEMP TABLE "_lift_costs" AS
SELECT "degreeId", MIN("planId") AS "planId"
FROM "_plan_cost_sig" GROUP BY "degreeId"
HAVING COUNT(*) = COUNT(sig) AND COUNT(DISTINCT sig) = 1;

INSERT INTO "degree_enrollment_costs" ("id", "degreeId", "name", "amount", "order", "updatedAt")
SELECT 'dc' || md5(c.id), l."degreeId", c."name", c."amount", c."order", CURRENT_TIMESTAMP
FROM "_lift_costs" l JOIN "study_plan_enrollment_costs" c ON c."studyPlanId" = l."planId";

DELETE FROM "study_plan_enrollment_costs" c
USING "study_plans" p, "_lift_costs" l
WHERE c."studyPlanId" = p.id AND p."degreeId" = l."degreeId";

DROP TABLE "_lift_costs";
DROP TABLE "_plan_cost_sig";

-- AlterTable
ALTER TABLE "study_plans" DROP COLUMN "tuitionMonths";
