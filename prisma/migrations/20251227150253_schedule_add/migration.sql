-- AlterTable
ALTER TABLE "ClassGroupWeeklySchedule" ADD COLUMN     "location" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "remote" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "remoteLink" TEXT;
