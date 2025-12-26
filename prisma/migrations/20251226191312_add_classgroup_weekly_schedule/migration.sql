-- CreateEnum
CREATE TYPE "WeekDay" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "ClassGroupWeeklySchedule" (
    "id" TEXT NOT NULL,
    "classGroupId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "weekday" "WeekDay" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassGroupWeeklySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClassGroupWeeklySchedule_classGroupId_courseId_weekday_star_key" ON "ClassGroupWeeklySchedule"("classGroupId", "courseId", "weekday", "startTime");

-- AddForeignKey
ALTER TABLE "ClassGroupWeeklySchedule" ADD CONSTRAINT "ClassGroupWeeklySchedule_classGroupId_fkey" FOREIGN KEY ("classGroupId") REFERENCES "ClassGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassGroupWeeklySchedule" ADD CONSTRAINT "ClassGroupWeeklySchedule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
