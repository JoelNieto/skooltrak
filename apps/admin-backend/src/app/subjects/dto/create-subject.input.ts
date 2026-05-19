import { Prisma } from '@generated/prisma';
export class CreateSubjectInput implements Prisma.SubjectUncheckedCreateInput {
    organizationId: string;
    name: string;
    code: string;
    shortName: string;
    schoolId: string;
}
