import { Prisma } from '@generated/prisma';
export class Parent
  implements
    Omit<Prisma.ParentGetPayload<{ include: { students: true } }>, 'students'>
{
    id: string;

    firstName: string;

    middleName: string;

    fatherName: string;

    motherName: string;

    documentId: string;

    phone: string;

    email: string;

    relationship: string;

    occupation: string;

    workPhone: string;

    address: string;

    organizationId: string;

    userId: string | null;

  // Students relation is omitted to avoid circular dependency
  // Access students through the parentsByStudentId query instead
  students: any[];

    createdAt: Date;

    updatedAt: Date;
}
