-- CreateEnum
CREATE TYPE "ChargeType" AS ENUM ('ENROLLMENT', 'TUITION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ChargeStatus" AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'OVERDUE');

-- AlterTable
ALTER TABLE "schools" ADD COLUMN     "currencyCode" TEXT NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "study_plans" ADD COLUMN     "monthlyTuitionAmount" DECIMAL(65,30),
ADD COLUMN     "tuitionMonths" INTEGER[];

-- CreateTable
CREATE TABLE "study_plan_enrollment_costs" (
    "id" TEXT NOT NULL,
    "studyPlanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_plan_enrollment_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charges" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "studentId" TEXT NOT NULL,
    "classGroupId" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "dueDate" DATE NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "chargeType" "ChargeType" NOT NULL DEFAULT 'CUSTOM',
    "status" "ChargeStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "paidAt" DATE NOT NULL,
    "reference" TEXT DEFAULT '',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "study_plan_enrollment_costs_studyPlanId_idx" ON "study_plan_enrollment_costs"("studyPlanId");

-- CreateIndex
CREATE INDEX "charges_schoolId_idx" ON "charges"("schoolId");

-- CreateIndex
CREATE INDEX "charges_schoolId_year_idx" ON "charges"("schoolId", "year");

-- CreateIndex
CREATE INDEX "charges_studentId_idx" ON "charges"("studentId");

-- CreateIndex
CREATE INDEX "payments_studentId_idx" ON "payments"("studentId");

-- AddForeignKey
ALTER TABLE "study_plan_enrollment_costs" ADD CONSTRAINT "study_plan_enrollment_costs_studyPlanId_fkey" FOREIGN KEY ("studyPlanId") REFERENCES "study_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_classGroupId_fkey" FOREIGN KEY ("classGroupId") REFERENCES "class_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
