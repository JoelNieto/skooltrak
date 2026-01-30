-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'CANDIDATE', 'RETIRED');

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_classGroupId_fkey";

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "allergies" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "bloodType" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "emergencyContactName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "emergencyContactPhone" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "enrollmentStatus" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "medicalNotes" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "classGroupId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Parent" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT NOT NULL DEFAULT '',
    "fatherName" TEXT NOT NULL,
    "motherName" TEXT NOT NULL DEFAULT '',
    "documentId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "occupation" TEXT NOT NULL DEFAULT '',
    "workPhone" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ParentToStudent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ParentToStudent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ParentToStudent_B_index" ON "_ParentToStudent"("B");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_classGroupId_fkey" FOREIGN KEY ("classGroupId") REFERENCES "ClassGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ParentToStudent" ADD CONSTRAINT "_ParentToStudent_A_fkey" FOREIGN KEY ("A") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ParentToStudent" ADD CONSTRAINT "_ParentToStudent_B_fkey" FOREIGN KEY ("B") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
