-- Corrective migration for `20260725051932_phase2_shared_ux`.
--
-- `student_class_group_history.classGroupId` was created NOT NULL while its
-- foreign key uses ON DELETE SET NULL, so deleting a class group raised a
-- not-null violation instead of preserving the history row.
--
-- The history table is an audit trail: rows must survive class-group deletion,
-- so the column becomes nullable (matching `students.classGroupId`) and the
-- existing SET NULL foreign key is kept.

-- AlterTable
ALTER TABLE "student_class_group_history" ALTER COLUMN "classGroupId" DROP NOT NULL;
