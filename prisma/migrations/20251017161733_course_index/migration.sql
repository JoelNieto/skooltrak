/*
  Warnings:

  - A unique constraint covering the columns `[schoolId,subjectId,studyPlanId]` on the table `Course` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Course_schoolId_subjectId_studyPlanId_key" ON "Course"("schoolId", "subjectId", "studyPlanId");
