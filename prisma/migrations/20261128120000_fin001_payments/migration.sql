-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'BANK_TRANSFER', 'YAPPY', 'CREDIT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'VOIDED');

-- AlterTable
ALTER TABLE "family_accounts" ADD COLUMN     "creditBalance" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "receivedAt" DATE NOT NULL,
    "reference" TEXT,
    "note" TEXT,
    "cardBrand" TEXT,
    "cardLast4" TEXT,
    "provider" TEXT,
    "providerRef" TEXT,
    "idempotencyKey" TEXT,
    "receiptNumber" INTEGER,
    "payerUserId" TEXT,
    "createdById" TEXT,
    "voidedAt" TIMESTAMP(3),
    "voidedById" TEXT,
    "voidReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_allocations" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "chargeId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reversedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_entries" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "paymentId" TEXT,
    "chargeId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_settings" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "receiptSeq" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotencyKey_key" ON "payments"("idempotencyKey");

-- CreateIndex
CREATE INDEX "payments_schoolId_method_reference_idx" ON "payments"("schoolId", "method", "reference");

-- CreateIndex
CREATE INDEX "payments_accountId_idx" ON "payments"("accountId");

-- CreateIndex
CREATE INDEX "payments_organizationId_schoolId_receivedAt_idx" ON "payments"("organizationId", "schoolId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "payments_schoolId_receiptNumber_key" ON "payments"("schoolId", "receiptNumber");

-- CreateIndex
CREATE INDEX "payment_allocations_paymentId_idx" ON "payment_allocations"("paymentId");

-- CreateIndex
CREATE INDEX "payment_allocations_chargeId_idx" ON "payment_allocations"("chargeId");

-- CreateIndex
CREATE INDEX "credit_entries_accountId_idx" ON "credit_entries"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "finance_settings_schoolId_key" ON "finance_settings"("schoolId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "family_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "charges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_entries" ADD CONSTRAINT "credit_entries_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "family_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_entries" ADD CONSTRAINT "credit_entries_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_entries" ADD CONSTRAINT "credit_entries_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "charges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_settings" ADD CONSTRAINT "finance_settings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

