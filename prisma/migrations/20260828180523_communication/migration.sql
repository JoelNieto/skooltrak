-- CreateEnum
CREATE TYPE "ThreadType" AS ENUM ('CLASS_GROUP', 'COURSE', 'STUDENT_GUARDIANS', 'SCHOOL_WIDE', 'DIRECT');

-- CreateEnum
CREATE TYPE "ThreadStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'PENDING_APPROVAL', 'APPROVED');

-- CreateEnum
CREATE TYPE "UrgencyTier" AS ENUM ('ROUTINE', 'IMPORTANT', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "DeliveryChannel" AS ENUM ('IN_APP', 'PUSH', 'EMAIL', 'SMS', 'VOICE');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'BOUNCED');

-- CreateTable
CREATE TABLE "communication_threads" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "ThreadType" NOT NULL,
    "scopeId" TEXT,
    "title" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "ownerRole" TEXT NOT NULL,
    "urgencyDefault" "UrgencyTier" NOT NULL DEFAULT 'ROUTINE',
    "status" "ThreadStatus" NOT NULL DEFAULT 'ACTIVE',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "broadcast" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "communication_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thread_participants" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "canInitiate" BOOLEAN NOT NULL DEFAULT false,
    "addedById" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3),

    CONSTRAINT "thread_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_messages" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "urgency" "UrgencyTier" NOT NULL DEFAULT 'ROUTINE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "communication_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_deliveries" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "channel" "DeliveryChannel" NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "novuEventId" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "failureReason" TEXT,

    CONSTRAINT "message_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipient_preferences" (
    "userId" TEXT NOT NULL,
    "language" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "channelPrefs" JSONB,
    "novuSubscriberId" TEXT,

    CONSTRAINT "recipient_preferences_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "communication_audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "organizationId" TEXT,
    "action" TEXT NOT NULL,
    "threadId" TEXT,
    "messageId" TEXT,
    "detail" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "communication_threads_organizationId_idx" ON "communication_threads"("organizationId");

-- CreateIndex
CREATE INDEX "communication_threads_scopeId_idx" ON "communication_threads"("scopeId");

-- CreateIndex
CREATE INDEX "communication_threads_status_idx" ON "communication_threads"("status");

-- CreateIndex
CREATE INDEX "thread_participants_userId_idx" ON "thread_participants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "thread_participants_threadId_userId_key" ON "thread_participants"("threadId", "userId");

-- CreateIndex
CREATE INDEX "communication_messages_threadId_idx" ON "communication_messages"("threadId");

-- CreateIndex
CREATE INDEX "message_deliveries_recipientUserId_idx" ON "message_deliveries"("recipientUserId");

-- CreateIndex
CREATE UNIQUE INDEX "message_deliveries_messageId_recipientUserId_channel_key" ON "message_deliveries"("messageId", "recipientUserId", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "message_deliveries_novuEventId_key" ON "message_deliveries"("novuEventId");

-- CreateIndex
CREATE INDEX "communication_audit_logs_organizationId_idx" ON "communication_audit_logs"("organizationId");

-- CreateIndex
CREATE INDEX "communication_audit_logs_action_idx" ON "communication_audit_logs"("action");

-- AddForeignKey
ALTER TABLE "thread_participants" ADD CONSTRAINT "thread_participants_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "communication_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thread_participants" ADD CONSTRAINT "thread_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "communication_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_deliveries" ADD CONSTRAINT "message_deliveries_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "communication_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_deliveries" ADD CONSTRAINT "message_deliveries_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipient_preferences" ADD CONSTRAINT "recipient_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_audit_logs" ADD CONSTRAINT "communication_audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
