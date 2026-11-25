-- COM-003-S04: reported direct conversations and admin access log (FR .20, BR .14).
-- CreateTable
CREATE TABLE "direct_conversation_reports" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "resolution" TEXT,

    CONSTRAINT "direct_conversation_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direct_conversation_accesses" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "direct_conversation_accesses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "direct_conversation_reports_conversationId_resolvedAt_idx" ON "direct_conversation_reports"("conversationId", "resolvedAt");

-- CreateIndex
CREATE INDEX "direct_conversation_accesses_conversationId_accessedAt_idx" ON "direct_conversation_accesses"("conversationId", "accessedAt");

-- AddForeignKey
ALTER TABLE "direct_conversation_reports" ADD CONSTRAINT "direct_conversation_reports_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "direct_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_conversation_reports" ADD CONSTRAINT "direct_conversation_reports_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_conversation_reports" ADD CONSTRAINT "direct_conversation_reports_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_conversation_accesses" ADD CONSTRAINT "direct_conversation_accesses_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "direct_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_conversation_accesses" ADD CONSTRAINT "direct_conversation_accesses_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

