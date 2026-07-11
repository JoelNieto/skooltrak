import { $Enums, Prisma } from '@generated/prisma';
import { ClassGroupRef } from './class-group-ref.entity';

export class UserStudent
  implements Prisma.StudentGetPayload<{ include: undefined }>
{
    id: string;
    firstName: string;
    middleName: string;
    fatherName: string;
    motherName: string;
    documentId: string;
    enrollmentCode: string | null;
    enrollmentCodeGeneratedAt: Date | null;
    organizationId: string;
    schoolId: string;
    classGroupId: string | null;

    classGroup: ClassGroupRef | null;

    birthDate: Date;
    gender: $Enums.Gender;
    address: string;
    phone: string;
    enrollmentStatus: $Enums.EnrollmentStatus;
    bloodType: string;
    allergies: string;
    medicalNotes: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
