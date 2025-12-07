import { User } from '@/auth';
import { Field, ObjectType } from '@nestjs/graphql';
import { $Enums, Prisma } from '@prisma/client';
import { ClassGroup } from '../../class-groups/entities/class-group.entity';
import { Course } from '../../courses/entities/course.entity';
import { Subject } from '../../subjects/entities/subject.entity';

@ObjectType()
export class Teacher
  implements
    Prisma.TeacherGetPayload<{
      include: { user: true; courses: true; classGroups: true; subjects: true };
    }>
{
  @Field(() => String, { description: 'ID of the teacher (auto-generated)' })
  id: string;
  @Field(() => String, { description: 'First name of the teacher' })
  firstName: string;
  @Field(() => String, { description: 'Middle name of the teacher' })
  middleName: string;
  @Field(() => String, { description: 'Father name of the teacher' })
  fatherName: string;
  @Field(() => String, { description: 'Mother name of the teacher' })
  motherName: string;
  @Field(() => String, { description: 'Document ID of the teacher' })
  documentId: string;
  @Field(() => String, { description: 'Organization ID of the teacher' })
  organizationId: string;
  @Field(() => Date, { description: 'Birth date of the teacher' })
  birthDate: Date;
  @Field(() => String, { description: 'Gender of the teacher' })
  gender: $Enums.Gender;
  @Field(() => String, { description: 'User ID of the teacher' })
  userId: string;
  @Field(() => [Course], { description: 'Courses of the teacher' })
  courses: Course[];

  @Field(() => [ClassGroup], { description: 'Groups of the teacher' })
  classGroups: ClassGroup[];

  @Field(() => [Subject], { description: 'Subject of the teacher' })
  subjects: Subject[];

  @Field(() => String, { description: 'Address of the teacher' })
  address: string;
  @Field(() => String, { description: 'Phone number of the teacher' })
  phoneNumber: string;
  @Field(() => String, { description: 'Personal email of the teacher' })
  personalEmail: string;
  @Field(() => String, { description: 'About the teacher' })
  about: string;
  @Field(() => Number, { description: 'Teacher since year' })
  teacherSince: number;
  @Field(() => Date, { description: 'Member since date' })
  memberSince: Date;
  @Field(() => User, { description: 'User of the teacher' })
  user: User;
  @Field(() => Date, { description: 'Created at' })
  createdAt: Date;
  @Field(() => Date, { description: 'Updated at' })
  updatedAt: Date;
}
