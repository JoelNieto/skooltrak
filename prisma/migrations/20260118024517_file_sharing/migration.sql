-- CreateEnum
CREATE TYPE "FilePermission" AS ENUM ('VIEW', 'EDIT');

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileShareUser" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" "FilePermission" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileShareUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileShareSchool" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "permission" "FilePermission" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileShareSchool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileShareClassGroup" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "classGroupId" TEXT NOT NULL,
    "permission" "FilePermission" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileShareClassGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileShareCourse" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "permission" "FilePermission" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileShareCourse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "File_organizationId_idx" ON "File"("organizationId");

-- CreateIndex
CREATE INDEX "File_ownerId_idx" ON "File"("ownerId");

-- CreateIndex
CREATE INDEX "FileShareUser_userId_idx" ON "FileShareUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FileShareUser_fileId_userId_key" ON "FileShareUser"("fileId", "userId");

-- CreateIndex
CREATE INDEX "FileShareSchool_schoolId_idx" ON "FileShareSchool"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "FileShareSchool_fileId_schoolId_key" ON "FileShareSchool"("fileId", "schoolId");

-- CreateIndex
CREATE INDEX "FileShareClassGroup_classGroupId_idx" ON "FileShareClassGroup"("classGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "FileShareClassGroup_fileId_classGroupId_key" ON "FileShareClassGroup"("fileId", "classGroupId");

-- CreateIndex
CREATE INDEX "FileShareCourse_courseId_idx" ON "FileShareCourse"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "FileShareCourse_fileId_courseId_key" ON "FileShareCourse"("fileId", "courseId");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileShareUser" ADD CONSTRAINT "FileShareUser_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileShareUser" ADD CONSTRAINT "FileShareUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileShareSchool" ADD CONSTRAINT "FileShareSchool_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileShareSchool" ADD CONSTRAINT "FileShareSchool_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileShareClassGroup" ADD CONSTRAINT "FileShareClassGroup_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileShareClassGroup" ADD CONSTRAINT "FileShareClassGroup_classGroupId_fkey" FOREIGN KEY ("classGroupId") REFERENCES "ClassGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileShareCourse" ADD CONSTRAINT "FileShareCourse_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileShareCourse" ADD CONSTRAINT "FileShareCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
