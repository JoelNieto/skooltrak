-- AlterEnum
ALTER TYPE "OnboardingAuditAction" ADD VALUE 'ORG_INVITATION_CREATED';
ALTER TYPE "OnboardingAuditAction" ADD VALUE 'ORG_INVITATION_ACCEPTED';

-- CreateEnum
CREATE TYPE "OrganizationInvitationStatus" AS ENUM ('SENT', 'DELIVERY_FAILED', 'ACCEPTED', 'REVOKED', 'SUPERSEDED');

-- CreateTable
CREATE TABLE "organization_invitations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "OrganizationInvitationStatus" NOT NULL DEFAULT 'SENT',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "lastSendError" TEXT,
    "sendAttempts" INTEGER NOT NULL DEFAULT 0,
    "invitedById" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "acceptedByUserId" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,
    "supersededById" TEXT,
    "linkRequestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_invitations_tokenHash_key" ON "organization_invitations"("tokenHash");

-- CreateIndex
CREATE INDEX "organization_invitations_organizationId_idx" ON "organization_invitations"("organizationId");

-- CreateIndex
CREATE INDEX "organization_invitations_email_idx" ON "organization_invitations"("email");

-- CreateIndex
CREATE INDEX "organization_invitations_organizationId_status_idx" ON "organization_invitations"("organizationId", "status");

-- AddForeignKey
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
