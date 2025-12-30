/*
  Warnings:

  - Made the column `remoteLink` on table `ClassGroupWeeklySchedule` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ClassGroupWeeklySchedule" ALTER COLUMN "remoteLink" SET NOT NULL,
ALTER COLUMN "remoteLink" SET DEFAULT '';
