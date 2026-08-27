-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "chargeId" TEXT;

-- AlterTable
ALTER TABLE "schools" ADD COLUMN     "schoolYearStartMonth" INTEGER NOT NULL DEFAULT 8;

-- CreateIndex
CREATE INDEX "payments_chargeId_idx" ON "payments"("chargeId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "charges"("id") ON DELETE SET NULL ON UPDATE CASCADE;
