-- HOM-001-S02: submission review state (BR-HOM-001.17)
ALTER TABLE "assignment_submissions" ADD COLUMN "reviewedAt" TIMESTAMP(3);

CREATE INDEX "assignment_submissions_assignmentId_reviewedAt_idx" ON "assignment_submissions"("assignmentId", "reviewedAt");
