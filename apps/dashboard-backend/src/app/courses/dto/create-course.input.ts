import { Prisma } from '@generated/prisma';
export class CreateCourseInput implements Prisma.CourseUncheckedCreateInput {
    name: string;

    code: string;

    shortName: string;

    organizationId: string;

    schoolId: string;

    subjectId: string;

    studyPlanId: string;

    teacherId?: string;

}
