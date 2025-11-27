-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "MessageRecipient" ADD COLUMN     "deletedAt" TIMESTAMP(3);
