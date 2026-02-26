-- DropForeignKey
ALTER TABLE "grade_buckets" DROP CONSTRAINT "grade_buckets_courseId_fkey";

-- AddForeignKey
ALTER TABLE "grade_buckets" ADD CONSTRAINT "grade_buckets_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
