-- AlterTable
ALTER TABLE "StudyPlan" ADD COLUMN     "gradeMetricId" TEXT;

-- CreateTable
CREATE TABLE "GradeMetric" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minimum" DECIMAL(65,30) NOT NULL,
    "maximum" DECIMAL(65,30) NOT NULL,
    "minimumApproval" DECIMAL(65,30) NOT NULL,
    "minimumExcellence" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradeMetric_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StudyPlan" ADD CONSTRAINT "StudyPlan_gradeMetricId_fkey" FOREIGN KEY ("gradeMetricId") REFERENCES "GradeMetric"("id") ON DELETE SET NULL ON UPDATE CASCADE;
