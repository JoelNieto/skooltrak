-- CreateTable
CREATE TABLE "Grade" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "comments" TEXT,
    "courseId" TEXT NOT NULL,
    "bucketId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeStudent" (
    "id" TEXT NOT NULL,
    "comments" TEXT,
    "gradeId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradeStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeStudentRevision" (
    "id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "gradeStudentId" TEXT NOT NULL,
    "score" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradeStudentRevision_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_bucketId_fkey" FOREIGN KEY ("bucketId") REFERENCES "GradeBucket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeStudent" ADD CONSTRAINT "GradeStudent_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeStudent" ADD CONSTRAINT "GradeStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeStudentRevision" ADD CONSTRAINT "GradeStudentRevision_gradeStudentId_fkey" FOREIGN KEY ("gradeStudentId") REFERENCES "GradeStudent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
