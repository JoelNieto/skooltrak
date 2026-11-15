import { Prisma } from '@generated/prisma';
import { Assignment } from '../../assignments/entities/assignment.entity';
import { File } from '../../files/entities/file.entity';
import { Student } from '../../students/entities/student.entity';

export class AssignmentSubmission
  implements
    Prisma.AssignmentSubmissionGetPayload<{
      include: { assignment: true; student: true; file: true };
    }>
{
    id: string;

    assignmentId: string;

    assignment: Assignment;

    studentId: string;

    student: Student;

    fileId: string;

    file: File;

    submittedAt: Date;

    /** Null until the course's teacher marks it reviewed (BR-HOM-001.17). */
    reviewedAt: Date | null;

    updatedAt: Date;
}

export class SubmissionUploadUrl {
    uploadUrl: string;

    storageKey: string;
}
