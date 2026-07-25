import { TransformDateToNoon } from '@/shared';
import { $Enums, Prisma } from '@generated/prisma';
type CreateStudentInputType = Omit<
  Prisma.StudentUncheckedCreateInput,
  'userId' | 'parents'
> & {
  email?: string;
  parentIds?: string[];
};

export class CreateStudentInput implements CreateStudentInputType {
    firstName: string;

    middleName: string;

    fatherName: string;

    motherName: string;

    documentId: string;

    organizationId: string;

    schoolId: string;

    classGroupId?: string;

  @TransformDateToNoon()
    birthDate: Date;

    gender: $Enums.Gender;

    address: string;

    phone: string;

    email?: string;

    enrollmentStatus?: $Enums.EnrollmentStatus;

    bloodType?: string;

    allergies?: string;

    medicalNotes?: string;

    emergencyContactName?: string;

    emergencyContactPhone?: string;

    parentIds?: string[];
}
