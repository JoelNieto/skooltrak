import { Prisma } from '@generated/prisma';
type CreateParentInputType = Omit<Prisma.ParentUncheckedCreateInput, 'students'> & {
  studentIds?: string[];
};

export class CreateParentInput implements CreateParentInputType {
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

    studentIds?: string[];
}
