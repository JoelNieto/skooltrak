import { User } from '@/auth';
import { $Enums, Prisma } from '@generated/prisma';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ClassGroup } from '../../class-groups/entities/class-group.entity';
import { Course } from '../../courses/entities/course.entity';
import { StudentGrade } from '../../student-grades/entities/student-grade.entity';

@ObjectType({ description: 'File info for student assignment submission' })
export class StudentSubmissionFile {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  mimeType: string;

  @Field(() => Int)
  size: number;
}

@ObjectType({ description: 'Student assignment submission info' })
export class StudentAssignmentSubmission {
  @Field(() => String)
  id: string;

  @Field(() => Date)
  submittedAt: Date;

  @Field(() => StudentSubmissionFile)
  file: StudentSubmissionFile;
}

@ObjectType()
export class Student
  implements
    Prisma.StudentGetPayload<{
      include: {
        classGroup: true;
        user: true;
        courses: true;
        studentGrades: true;
      };
    }>
{
  @Field(() => String, { description: 'ID of the student' })
  id: string;
  @Field(() => String, { description: 'First name of the student' })
  firstName: string;
  @Field(() => String, { description: 'Middle name of the student' })
  middleName: string;
  @Field(() => String, { description: 'Father name of the student' })
  fatherName: string;
  @Field(() => String, { description: 'Mother name of the student' })
  motherName: string;
  @Field(() => String, { description: 'Document ID of the student' })
  documentId: string;
  @Field(() => String, { description: 'Organization ID of the student' })
  organizationId: string;
  @Field(() => String, { description: 'School ID of the student' })
  schoolId: string;
  @Field(() => String, { description: 'Class group ID of the student' })
  classGroupId: string;
  @Field(() => ClassGroup, { description: 'Class group of the student' })
  classGroup: ClassGroup;
  @Field(() => Date, { description: 'Birth date of the student' })
  birthDate: Date;
  @Field(() => String, { description: 'Gender of the student' })
  gender: $Enums.Gender;
  @Field(() => String, { description: 'Address of the student' })
  address: string;
  @Field(() => String, { description: 'Phone of the student' })
  phone: string;

  @Field(() => [StudentGrade], { description: 'Student grades of the student' })
  studentGrades: StudentGrade[];

  @Field(() => [StudentAssignmentSubmission], {
    description: 'Assignment submissions by the student',
  })
  assignmentSubmissions: StudentAssignmentSubmission[];

  @Field(() => User, { description: 'User of the student' })
  user: User;
  @Field(() => String, { description: 'User ID of the student' })
  userId: string;
  @Field(() => [Course], { description: 'Courses of the student' })
  courses: Course[];

  @Field(() => Date, { description: 'Created at of the student' })
  createdAt: Date;
  @Field(() => Date, { description: 'Updated at of the student' })
  updatedAt: Date;
}
