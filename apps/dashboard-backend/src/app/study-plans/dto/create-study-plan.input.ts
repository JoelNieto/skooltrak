import { Prisma } from '@generated/prisma';
export class CreateStudyPlanInput
  implements Prisma.StudyPlanUncheckedCreateInput
{
    name: string;

    shortName: string;

    level: number;

    degreeId: string;

    description: string;

    schoolId: string;

    gradeMetricId: string;
}
