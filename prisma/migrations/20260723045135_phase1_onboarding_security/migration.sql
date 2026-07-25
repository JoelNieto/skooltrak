-- CreateEnum
CREATE TYPE "OnboardingAuditAction" AS ENUM ('REQUEST_JOIN_SCHOOL', 'LINK_CHILD', 'VERIFY_STUDENT', 'APPROVE_JOIN_REQUEST', 'REJECT_JOIN_REQUEST', 'RESEND_INVITATION', 'INVITATION_CREATED', 'INVITATION_EMAIL_FAILED', 'ENROLLMENT_CODE_REGENERATED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "invitationEmailStatus" TEXT;

-- CreateTable
CREATE TABLE "onboarding_audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "userId" TEXT,
    "organizationId" TEXT,
    "action" "OnboardingAuditAction" NOT NULL,
    "detail" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "onboarding_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "onboarding_audit_logs_userId_idx" ON "onboarding_audit_logs"("userId");

-- CreateIndex
CREATE INDEX "onboarding_audit_logs_organizationId_idx" ON "onboarding_audit_logs"("organizationId");

-- CreateIndex
CREATE INDEX "onboarding_audit_logs_action_idx" ON "onboarding_audit_logs"("action");

-- Data fix: resolve ORG_ADMIN permission drift.
-- Existing ORG_ADMIN roles were created with a snapshot of all permissions at
-- creation time, so newly added permissions were never granted. This connects
-- every permission to every ORG_ADMIN role that does not yet have it. The
-- application guard also short-circuits ORG_ADMIN, but this keeps the stored
-- role row consistent for reporting and future checks.
INSERT INTO "_PermissionToRole" ("A", "B")
SELECT p."id", r."id"
FROM "permissions" p
CROSS JOIN "roles" r
WHERE r."name" = 'ORG_ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM "_PermissionToRole" rp
    WHERE rp."A" = p."id" AND rp."B" = r."id"
  );
