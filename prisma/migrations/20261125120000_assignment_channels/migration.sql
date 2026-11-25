-- COM-003-S02: assignment Q&A channels (FR .17, .18; BR .10, .11).
-- AlterEnum
ALTER TYPE "ChannelScope" ADD VALUE 'ASSIGNMENT';

-- AlterTable
ALTER TABLE "channels" ADD COLUMN     "assignmentId" TEXT,
ADD COLUMN     "closesAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "channel_posts" ADD COLUMN     "pinned" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "channels_assignmentId_key" ON "channels"("assignmentId");

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

