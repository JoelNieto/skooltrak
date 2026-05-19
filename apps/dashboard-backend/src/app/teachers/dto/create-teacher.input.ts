import { TransformDateToNoon } from '@/shared';
import { $Enums, Prisma } from '@generated/prisma';
type CreateTeacherInputType = Omit<Prisma.TeacherUncheckedCreateInput, 'userId'> & {
  email: string;
};

export class CreateTeacherInput implements CreateTeacherInputType {
    firstName: string;
    middleName: string;
    fatherName: string;
    motherName: string;
    documentId: string;
    organizationId: string;
  @TransformDateToNoon()
    birthDate: Date;

    address?: string;

    about?: string;

    phoneNumber?: string;

    personalEmail?: string;
    gender: $Enums.Gender;
    email: string;
    teacherSince?: number;
    memberSince?: Date;
}
