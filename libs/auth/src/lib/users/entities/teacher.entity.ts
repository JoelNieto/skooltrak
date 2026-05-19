import { $Enums, Prisma } from '@generated/prisma';
export class UserTeacher
  implements Prisma.TeacherGetPayload<{ include: undefined }>
{
  teacherSince: number | null;
  memberSince: Date | null;
  address: string;
  phoneNumber: string;
  personalEmail: string;
  about: string;
    id: string;
    firstName: string;
    middleName: string;
    fatherName: string;
    motherName: string;
    documentId: string;
    organizationId: string;
    birthDate: Date;
    gender: $Enums.Gender;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
