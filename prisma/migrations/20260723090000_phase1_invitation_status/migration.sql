-- Drop the column that was added in the previous migration; the invitation
-- email result now lives in the dedicated "invitation_status" table to avoid
-- widening the users model (which ripples into hand-written GraphQL entities).
ALTER TABLE "users" DROP COLUMN "invitationEmailStatus";

-- CreateTable
CREATE TABLE "invitation_status" (
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "detail" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitation_status_pkey" PRIMARY KEY ("userId")
);
