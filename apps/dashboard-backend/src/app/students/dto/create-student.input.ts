import { TransformDateToNoon } from '@/shared';
import { $Enums, Prisma } from '@generated/prisma';
import { Field, InputType } from '@nestjs/graphql';

type CreateStudentInputType = Omit<
  Prisma.StudentUncheckedCreateInput,
  'userId' | 'parents'
> & {
  email: string;
  parentIds?: string[];
};

@InputType()
export class CreateStudentInput implements CreateStudentInputType {
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

  @Field(() => String, { description: 'Class group ID of the student', nullable: true })
  classGroupId?: string;

  @TransformDateToNoon()
  @Field(() => Date, { description: 'Birth date of the student' })
  birthDate: Date;

  @Field(() => String, { description: 'Gender of the student' })
  gender: $Enums.Gender;

  @Field(() => String, { description: 'Address of the student' })
  address: string;

  @Field(() => String, { description: 'Phone of the student' })
  phone: string;

  @Field(() => String, { description: 'Email of the student' })
  email: string;

  @Field(() => String, {
    description: 'Enrollment status of the student',
    nullable: true,
    defaultValue: 'ACTIVE',
  })
  enrollmentStatus?: $Enums.EnrollmentStatus;

  @Field(() => String, { description: 'Blood type of the student', nullable: true, defaultValue: '' })
  bloodType?: string;

  @Field(() => String, { description: 'Allergies of the student', nullable: true, defaultValue: '' })
  allergies?: string;

  @Field(() => String, { description: 'Medical notes of the student', nullable: true, defaultValue: '' })
  medicalNotes?: string;

  @Field(() => String, { description: 'Emergency contact name', nullable: true, defaultValue: '' })
  emergencyContactName?: string;

  @Field(() => String, { description: 'Emergency contact phone', nullable: true, defaultValue: '' })
  emergencyContactPhone?: string;

  @Field(() => [String], { description: 'IDs of parents to associate with this student', nullable: true })
  parentIds?: string[];
}
