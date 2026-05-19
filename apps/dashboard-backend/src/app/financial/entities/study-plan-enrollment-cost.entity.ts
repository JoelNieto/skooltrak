import { Prisma } from '@generated/prisma';
export class StudyPlanEnrollmentCost
  implements Prisma.StudyPlanEnrollmentCostGetPayload<{ include: undefined }>
{
    id: string;

    studyPlanId: string;

    name: string;

    amount: Prisma.Decimal;

    order: number;

    createdAt: Date;

    updatedAt: Date;
}
