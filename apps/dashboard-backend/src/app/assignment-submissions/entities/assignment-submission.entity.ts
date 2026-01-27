import { Prisma } from '@generated/prisma';
import { Field, ObjectType } from '@nestjs/graphql';
import { Assignment } from '../../assignments/entities/assignment.entity';
import { File } from '../../files/entities/file.entity';
import { Student } from '../../students/entities/student.entity';

@ObjectType()
export class AssignmentSubmission
  implements
    Prisma.AssignmentSubmissionGetPayload<{
      include: { assignment: true; student: true; file: true };
    }>
{
  @Field(() => String, { description: 'ID of the submission' })
  id: string;

  @Field(() => String, { description: 'Assignment ID' })
  assignmentId: string;

  @Field(() => Assignment, { description: 'Assignment of the submission' })
  assignment: Assignment;

  @Field(() => String, { description: 'Student ID' })
  studentId: string;

  @Field(() => Student, { description: 'Student who submitted' })
  student: Student;

  @Field(() => String, { description: 'File ID' })
  fileId: string;

  @Field(() => File, { description: 'Submitted file' })
  file: File;

  @Field(() => Date, { description: 'Submission date' })
  submittedAt: Date;

  @Field(() => Date, { description: 'Updated at' })
  updatedAt: Date;
}

@ObjectType()
export class SubmissionUploadUrl {
  @Field(() => String, { description: 'Presigned URL for uploading the file' })
  uploadUrl: string;

  @Field(() => String, { description: 'Storage key for the file' })
  storageKey: string;
}
