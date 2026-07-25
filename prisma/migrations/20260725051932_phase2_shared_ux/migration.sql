-- CreateEnum
CREATE TYPE "AuthTokenType" AS ENUM ('MAGIC_LINK', 'CHILD_CONNECT');

-- CreateEnum
CREATE TYPE "ImportEntityType" AS ENUM ('STUDENT', 'TEACHER');

-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('DRY_RUN', 'COMMITTED', 'FAILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OnboardingAuditAction" ADD VALUE 'MAGIC_LINK_ISSUED';
ALTER TYPE "OnboardingAuditAction" ADD VALUE 'MAGIC_LINK_CONSUMED';
ALTER TYPE "OnboardingAuditAction" ADD VALUE 'MAGIC_LINK_REJECTED';
ALTER TYPE "OnboardingAuditAction" ADD VALUE 'CHILD_CONNECT_ISSUED';
ALTER TYPE "OnboardingAuditAction" ADD VALUE 'CHILD_CONNECT_CONSUMED';
ALTER TYPE "OnboardingAuditAction" ADD VALUE 'CHILD_CONNECT_REJECTED';
ALTER TYPE "OnboardingAuditAction" ADD VALUE 'BULK_IMPORT_COMMITTED';
ALTER TYPE "OnboardingAuditAction" ADD VALUE 'CLASS_GROUP_CHANGED';

-- AlterTable
ALTER TABLE "invitation_status" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "students" ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "auth_tokens" (
    "id" TEXT NOT NULL,
    "type" "AuthTokenType" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT,
    "studentId" TEXT,
    "organizationId" TEXT,
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "consumedByUserId" TEXT,
    "createdById" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_class_group_history" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classGroupId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "reason" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_class_group_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "entityType" "ImportEntityType" NOT NULL,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'DRY_RUN',
    "createdById" TEXT,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "createdCount" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_tokens_tokenHash_key" ON "auth_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "auth_tokens_type_expiresAt_idx" ON "auth_tokens"("type", "expiresAt");

-- CreateIndex
CREATE INDEX "auth_tokens_userId_idx" ON "auth_tokens"("userId");

-- CreateIndex
CREATE INDEX "auth_tokens_studentId_idx" ON "auth_tokens"("studentId");

-- CreateIndex
CREATE INDEX "student_class_group_history_studentId_startedAt_idx" ON "student_class_group_history"("studentId", "startedAt");

-- CreateIndex
CREATE INDEX "student_class_group_history_classGroupId_idx" ON "student_class_group_history"("classGroupId");

-- CreateIndex
CREATE INDEX "import_jobs_organizationId_idx" ON "import_jobs"("organizationId");

-- AddForeignKey
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_class_group_history" ADD CONSTRAINT "student_class_group_history_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_class_group_history" ADD CONSTRAINT "student_class_group_history_classGroupId_fkey" FOREIGN KEY ("classGroupId") REFERENCES "class_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_class_group_history" ADD CONSTRAINT "student_class_group_history_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_class_group_history" ADD CONSTRAINT "student_class_group_history_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: open class-group history row for every student already assigned to a group.
INSERT INTO "student_class_group_history" ("id", "studentId", "classGroupId", "schoolId", "organizationId", "startedAt", "reason")
SELECT gen_random_uuid(), s."id", s."classGroupId", s."schoolId", s."organizationId", s."createdAt", 'backfill'
FROM "students" s
WHERE s."classGroupId" IS NOT NULL;
