import { COURSE_COLOR_KEYS } from '@/shared';
import { CourseColor, Prisma } from '@generated/prisma';
import { IsIn, IsOptional } from 'class-validator';

export class CreateCourseInput implements Prisma.CourseUncheckedCreateInput {
    name: string;

    code: string;

    shortName: string;

    organizationId: string;

    schoolId: string;

    subjectId: string;

    studyPlanId: string;

    teacherId?: string;

    /** One of the 8 color tags (ACA-001 BR .11); null clears it back to the derived default. */
    @IsOptional()
    @IsIn(COURSE_COLOR_KEYS, { message: 'Color de curso inválido' })
    color?: CourseColor | null;
}
