-- Add studyPlanId column
ALTER TABLE "charges" ADD COLUMN "studyPlanId" TEXT;

-- Migrate: set studyPlanId from classGroup's studyPlanId where classGroupId exists
UPDATE "charges" c
SET "studyPlanId" = cg."studyPlanId"
FROM "class_groups" cg
WHERE c."classGroupId" = cg."id";

-- DropForeignKey
ALTER TABLE "charges" DROP CONSTRAINT "charges_classGroupId_fkey";

-- Drop classGroupId column
ALTER TABLE "charges" DROP COLUMN "classGroupId";

-- CreateIndex
CREATE INDEX "charges_studyPlanId_idx" ON "charges"("studyPlanId");

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_studyPlanId_fkey" FOREIGN KEY ("studyPlanId") REFERENCES "study_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
