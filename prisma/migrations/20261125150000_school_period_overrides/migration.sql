-- CreateTable
CREATE TABLE "school_periods" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "name" TEXT,
    "shortName" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_periods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "school_periods_periodId_idx" ON "school_periods"("periodId");

-- CreateIndex
CREATE UNIQUE INDEX "school_periods_schoolId_periodId_key" ON "school_periods"("schoolId", "periodId");

-- AddForeignKey
ALTER TABLE "school_periods" ADD CONSTRAINT "school_periods_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_periods" ADD CONSTRAINT "school_periods_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
