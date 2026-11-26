-- CreateEnum
CREATE TYPE "FeeKind" AS ENUM ('ENROLLMENT', 'TUITION', 'OTHER');

-- CreateEnum
CREATE TYPE "FeeSchedule" AS ENUM ('ONE_TIME', 'MONTHLY');

-- AlterTable
ALTER TABLE "charges" ADD COLUMN     "feeItemId" TEXT,
ADD COLUMN     "installment" INTEGER;

-- CreateTable
CREATE TABLE "fee_items" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "FeeKind" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "schedule" "FeeSchedule" NOT NULL,
    "dueMonth" INTEGER,
    "startMonth" INTEGER,
    "endMonth" INTEGER,
    "dueDay" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_assignments" (
    "id" TEXT NOT NULL,
    "feeItemId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "degreeId" TEXT,
    "studyPlanId" TEXT,
    "amountOverride" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fee_items_schoolId_name_key" ON "fee_items"("schoolId", "name");

-- CreateIndex
CREATE INDEX "fee_assignments_year_idx" ON "fee_assignments"("year");

-- CreateIndex
CREATE UNIQUE INDEX "fee_assignments_feeItemId_year_degreeId_key" ON "fee_assignments"("feeItemId", "year", "degreeId");

-- CreateIndex
CREATE UNIQUE INDEX "fee_assignments_feeItemId_year_studyPlanId_key" ON "fee_assignments"("feeItemId", "year", "studyPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "charges_studentId_feeItemId_year_installment_key" ON "charges"("studentId", "feeItemId", "year", "installment");

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_feeItemId_fkey" FOREIGN KEY ("feeItemId") REFERENCES "fee_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_items" ADD CONSTRAINT "fee_items_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_assignments" ADD CONSTRAINT "fee_assignments_feeItemId_fkey" FOREIGN KEY ("feeItemId") REFERENCES "fee_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_assignments" ADD CONSTRAINT "fee_assignments_degreeId_fkey" FOREIGN KEY ("degreeId") REFERENCES "degrees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_assignments" ADD CONSTRAINT "fee_assignments_studyPlanId_fkey" FOREIGN KEY ("studyPlanId") REFERENCES "study_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- A fee assignment targets a degree or a study plan, never both or neither (FR-FIN-001.5).
ALTER TABLE "fee_assignments" ADD CONSTRAINT "fee_assignments_target_check" CHECK (("degreeId" IS NULL) <> ("studyPlanId" IS NULL));
