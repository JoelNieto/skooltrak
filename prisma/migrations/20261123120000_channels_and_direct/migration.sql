-- COM-003: two ways to communicate, channels and direct messages. Every earlier communication
-- system (mail-style messages, chats, v2 threads/broadcasts, deliveries, newsletters) is removed
-- together with its data.

-- Drop the legacy systems
DROP TABLE IF EXISTS "message_recipients" CASCADE;
DROP TABLE IF EXISTS "messages" CASCADE;
DROP TABLE IF EXISTS "chat_messages" CASCADE;
DROP TABLE IF EXISTS "chat_participants" CASCADE;
DROP TABLE IF EXISTS "chats" CASCADE;
DROP TABLE IF EXISTS "message_deliveries" CASCADE;
DROP TABLE IF EXISTS "communication_messages" CASCADE;
DROP TABLE IF EXISTS "thread_participants" CASCADE;
DROP TABLE IF EXISTS "communication_threads" CASCADE;
DROP TABLE IF EXISTS "recipient_preferences" CASCADE;
DROP TABLE IF EXISTS "communication_audit_logs" CASCADE;
DROP TABLE IF EXISTS "newsletters" CASCADE;
DROP TYPE IF EXISTS "ChatType";
DROP TYPE IF EXISTS "ChatParticipantRole";
DROP TYPE IF EXISTS "ThreadType";
DROP TYPE IF EXISTS "ThreadStatus";
DROP TYPE IF EXISTS "UrgencyTier";
DROP TYPE IF EXISTS "DeliveryChannel";
DROP TYPE IF EXISTS "DeliveryStatus";

-- Permissions. COMMUNICATION_BROADCAST becomes COMMUNICATION_CHANNELS, so every role keeps its
-- grant; COMMUNICATION_DIRECT is new. The legacy keys go away. Admins pass every check already.
UPDATE "permissions" SET "descriptiveId" = 'COMMUNICATION_CHANNELS', "description" = 'Create and manage channels', "updatedAt" = now()
  WHERE "descriptiveId" = 'COMMUNICATION_BROADCAST'
    AND NOT EXISTS (SELECT 1 FROM "permissions" WHERE "descriptiveId" = 'COMMUNICATION_CHANNELS');
DELETE FROM "permissions"
  WHERE "descriptiveId" IN ('COMMUNICATION_BROADCAST', 'COMMUNICATION_APPROVE', 'MANAGE_MESSAGES', 'VIEW_MESSAGES', 'MANAGE_NEWSLETTER', 'VIEW_NEWSLETTER');

INSERT INTO "permissions" ("id", "descriptiveId", "description", "createdAt", "updatedAt")
VALUES
  ('perm_communication_view', 'COMMUNICATION_VIEW', 'Read channels and reply where allowed', now(), now()),
  ('perm_communication_channels', 'COMMUNICATION_CHANNELS', 'Create and manage channels', now(), now()),
  ('perm_communication_direct', 'COMMUNICATION_DIRECT', 'Use direct messages between staff and parents', now(), now())
ON CONFLICT ("descriptiveId") DO NOTHING;

-- Teachers: view, channels, direct. Students: view. Parents: view, direct (every organization).
INSERT INTO "_PermissionToRole" ("A", "B")
SELECT p."id", r."id"
FROM "permissions" p
JOIN "roles" r ON (
  (upper(r."name") = 'TEACHER' AND p."descriptiveId" IN ('COMMUNICATION_VIEW', 'COMMUNICATION_CHANNELS', 'COMMUNICATION_DIRECT'))
  OR (upper(r."name") = 'STUDENT' AND p."descriptiveId" = 'COMMUNICATION_VIEW')
  OR (upper(r."name") = 'PARENT' AND p."descriptiveId" IN ('COMMUNICATION_VIEW', 'COMMUNICATION_DIRECT'))
)
ON CONFLICT DO NOTHING;

-- CreateEnum
CREATE TYPE "ChannelScope" AS ENUM ('ORGANIZATION', 'SCHOOL', 'STUDY_PLAN', 'CLASS_GROUP', 'COURSE');

-- CreateEnum
CREATE TYPE "ChannelReplyVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateTable
CREATE TABLE "channels" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "scope" "ChannelScope" NOT NULL,
    "schoolId" TEXT,
    "studyPlanId" TEXT,
    "classGroupId" TEXT,
    "courseId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "audienceStudents" BOOLEAN NOT NULL DEFAULT true,
    "audienceParents" BOOLEAN NOT NULL DEFAULT true,
    "studentsCanReply" BOOLEAN NOT NULL DEFAULT false,
    "parentsCanReply" BOOLEAN NOT NULL DEFAULT false,
    "replyVisibility" "ChannelReplyVisibility" NOT NULL DEFAULT 'PRIVATE',
    "createdById" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_posts" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "requiresConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "channel_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_replies" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT,
    "threadUserId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "channel_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_post_reads" (
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "channel_post_reads_pkey" PRIMARY KEY ("postId","userId")
);

-- CreateTable
CREATE TABLE "direct_conversations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "staffUserId" TEXT NOT NULL,
    "parentUserId" TEXT NOT NULL,
    "studentId" TEXT,
    "staffLastReadAt" TIMESTAMP(3),
    "parentLastReadAt" TIMESTAMP(3),
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "direct_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direct_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "direct_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "channels_organizationId_scope_idx" ON "channels"("organizationId", "scope");

-- CreateIndex
CREATE INDEX "channels_schoolId_idx" ON "channels"("schoolId");

-- CreateIndex
CREATE INDEX "channels_studyPlanId_idx" ON "channels"("studyPlanId");

-- CreateIndex
CREATE INDEX "channels_classGroupId_idx" ON "channels"("classGroupId");

-- CreateIndex
CREATE INDEX "channels_courseId_idx" ON "channels"("courseId");

-- CreateIndex
CREATE INDEX "channel_posts_channelId_createdAt_idx" ON "channel_posts"("channelId", "createdAt");

-- CreateIndex
CREATE INDEX "channel_replies_postId_threadUserId_idx" ON "channel_replies"("postId", "threadUserId");

-- CreateIndex
CREATE INDEX "channel_post_reads_userId_idx" ON "channel_post_reads"("userId");

-- CreateIndex
CREATE INDEX "direct_conversations_staffUserId_lastMessageAt_idx" ON "direct_conversations"("staffUserId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "direct_conversations_parentUserId_lastMessageAt_idx" ON "direct_conversations"("parentUserId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "direct_conversations_studentId_idx" ON "direct_conversations"("studentId");

-- CreateIndex
CREATE INDEX "direct_messages_conversationId_createdAt_idx" ON "direct_messages"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_studyPlanId_fkey" FOREIGN KEY ("studyPlanId") REFERENCES "study_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_classGroupId_fkey" FOREIGN KEY ("classGroupId") REFERENCES "class_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_posts" ADD CONSTRAINT "channel_posts_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_posts" ADD CONSTRAINT "channel_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_replies" ADD CONSTRAINT "channel_replies_postId_fkey" FOREIGN KEY ("postId") REFERENCES "channel_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_replies" ADD CONSTRAINT "channel_replies_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_replies" ADD CONSTRAINT "channel_replies_threadUserId_fkey" FOREIGN KEY ("threadUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_post_reads" ADD CONSTRAINT "channel_post_reads_postId_fkey" FOREIGN KEY ("postId") REFERENCES "channel_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_post_reads" ADD CONSTRAINT "channel_post_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_conversations" ADD CONSTRAINT "direct_conversations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_conversations" ADD CONSTRAINT "direct_conversations_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_conversations" ADD CONSTRAINT "direct_conversations_parentUserId_fkey" FOREIGN KEY ("parentUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_conversations" ADD CONSTRAINT "direct_conversations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "direct_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
