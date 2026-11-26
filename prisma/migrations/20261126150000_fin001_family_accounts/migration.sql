-- FIN-001-S01: replace the legacy finance model with family accounts and a new charge ledger.
-- Legacy finance data is dropped without migration (FIN-001 Q1, dev/pilot data only).

-- DropLegacy
DROP TABLE IF EXISTS "payments";
DROP TABLE IF EXISTS "charges";
DROP TABLE IF EXISTS "degree_enrollment_costs";
DROP TABLE IF EXISTS "study_plan_enrollment_costs";
DROP TYPE IF EXISTS "ChargeType";
DROP TYPE IF EXISTS "ChargeStatus";

ALTER TABLE "degrees" DROP COLUMN IF EXISTS "monthlyTuitionAmount",
DROP COLUMN IF EXISTS "tuitionStartMonth",
DROP COLUMN IF EXISTS "tuitionEndMonth";

ALTER TABLE "study_plans" DROP COLUMN IF EXISTS "monthlyTuitionAmount",
DROP COLUMN IF EXISTS "tuitionStartMonth",
DROP COLUMN IF EXISTS "tuitionEndMonth";

-- CreateEnum
CREATE TYPE "ChargeSource" AS ENUM ('FEE', 'MANUAL', 'LATE_FEE', 'STORE_ORDER');

-- CreateTable
CREATE TABLE "family_accounts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_account_students" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_account_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charges" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "studentId" TEXT,
    "year" INTEGER NOT NULL,
    "source" "ChargeSource" NOT NULL DEFAULT 'MANUAL',
    "description" TEXT NOT NULL,
    "grossAmount" DECIMAL(12,2) NOT NULL,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(12,2) NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "dueDate" DATE NOT NULL,
    "createdById" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledById" TEXT,
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_audit_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "family_accounts_schoolId_number_key" ON "family_accounts"("schoolId", "number");
CREATE INDEX "family_accounts_organizationId_schoolId_idx" ON "family_accounts"("organizationId", "schoolId");
CREATE UNIQUE INDEX "family_account_students_studentId_schoolId_key" ON "family_account_students"("studentId", "schoolId");
CREATE INDEX "family_account_students_accountId_idx" ON "family_account_students"("accountId");
CREATE INDEX "charges_organizationId_schoolId_dueDate_idx" ON "charges"("organizationId", "schoolId", "dueDate");
CREATE INDEX "charges_accountId_idx" ON "charges"("accountId");
CREATE INDEX "charges_studentId_idx" ON "charges"("studentId");
CREATE INDEX "finance_audit_logs_organizationId_schoolId_createdAt_idx" ON "finance_audit_logs"("organizationId", "schoolId", "createdAt");
CREATE INDEX "finance_audit_logs_entity_entityId_idx" ON "finance_audit_logs"("entity", "entityId");

-- AddForeignKey
ALTER TABLE "family_accounts" ADD CONSTRAINT "family_accounts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "family_accounts" ADD CONSTRAINT "family_accounts_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "family_account_students" ADD CONSTRAINT "family_account_students_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "family_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "family_account_students" ADD CONSTRAINT "family_account_students_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "charges" ADD CONSTRAINT "charges_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "charges" ADD CONSTRAINT "charges_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "charges" ADD CONSTRAINT "charges_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "family_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "charges" ADD CONSTRAINT "charges_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;
