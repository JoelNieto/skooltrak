-- CreateEnum
CREATE TYPE "HabitValue" AS ENUM ('X', 'R', 'S');

-- CreateTable
CREATE TABLE "habit_metrics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habit_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_evaluations" (
    "id" TEXT NOT NULL,
    "habitMetricId" TEXT NOT NULL,
    "classGroupId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habit_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_habit_evaluations" (
    "id" TEXT NOT NULL,
    "habitEvaluationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "value" "HabitValue" NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_habit_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "habit_metrics_organizationId_active_idx" ON "habit_metrics"("organizationId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "habit_metrics_organizationId_name_key" ON "habit_metrics"("organizationId", "name");

-- CreateIndex
CREATE INDEX "habit_evaluations_classGroupId_periodId_idx" ON "habit_evaluations"("classGroupId", "periodId");

-- CreateIndex
CREATE UNIQUE INDEX "habit_evaluations_habitMetricId_classGroupId_periodId_key" ON "habit_evaluations"("habitMetricId", "classGroupId", "periodId");

-- CreateIndex
CREATE INDEX "student_habit_evaluations_studentId_idx" ON "student_habit_evaluations"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "student_habit_evaluations_habitEvaluationId_studentId_key" ON "student_habit_evaluations"("habitEvaluationId", "studentId");

-- AddForeignKey
ALTER TABLE "habit_metrics" ADD CONSTRAINT "habit_metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_evaluations" ADD CONSTRAINT "habit_evaluations_habitMetricId_fkey" FOREIGN KEY ("habitMetricId") REFERENCES "habit_metrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_evaluations" ADD CONSTRAINT "habit_evaluations_classGroupId_fkey" FOREIGN KEY ("classGroupId") REFERENCES "class_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_evaluations" ADD CONSTRAINT "habit_evaluations_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_evaluations" ADD CONSTRAINT "habit_evaluations_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_evaluations" ADD CONSTRAINT "habit_evaluations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_habit_evaluations" ADD CONSTRAINT "student_habit_evaluations_habitEvaluationId_fkey" FOREIGN KEY ("habitEvaluationId") REFERENCES "habit_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_habit_evaluations" ADD CONSTRAINT "student_habit_evaluations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
