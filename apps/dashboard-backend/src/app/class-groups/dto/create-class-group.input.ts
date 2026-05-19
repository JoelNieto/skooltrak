import { Prisma } from '@generated/prisma';
export class CreateClassGroupInput
  implements Prisma.ClassGroupUncheckedCreateInput
{
    name: string;
    organizationId: string;
    schoolId: string;
    studyPlanId: string;
    teacherId: string;
    active: boolean;
}
