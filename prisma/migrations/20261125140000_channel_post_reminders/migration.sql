-- COM-003-S05: one email reminder per member per post that asks for confirmation (FR .21, BR .15).
-- CreateTable
CREATE TABLE "channel_post_reminders" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_post_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "channel_post_reminders_postId_userId_key" ON "channel_post_reminders"("postId", "userId");

-- AddForeignKey
ALTER TABLE "channel_post_reminders" ADD CONSTRAINT "channel_post_reminders_postId_fkey" FOREIGN KEY ("postId") REFERENCES "channel_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_post_reminders" ADD CONSTRAINT "channel_post_reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

