-- DropForeignKey
ALTER TABLE "join_requests" DROP CONSTRAINT "join_requests_schoolId_fkey";

-- AddForeignKey
ALTER TABLE "join_requests" ADD CONSTRAINT "join_requests_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
