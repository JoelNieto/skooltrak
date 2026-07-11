-- AlterTable: add per-student enrollment code for parent self-linking
ALTER TABLE "students" ADD COLUMN "enrollmentCode" TEXT;
ALTER TABLE "students" ADD COLUMN "enrollmentCodeGeneratedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "students_enrollmentCode_key" ON "students"("enrollmentCode");

-- CreateIndex: compound unique (userId, organizationId) for Parent.
-- NULL userId rows remain allowed/distinct (Postgres treats NULLs as not equal).
CREATE UNIQUE INDEX "parents_userId_organizationId_key" ON "parents"("userId", "organizationId");
