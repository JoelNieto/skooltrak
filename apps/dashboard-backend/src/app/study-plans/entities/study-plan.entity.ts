import { Prisma } from '@generated/prisma';
import { Degree } from '../../degrees/entities/degree.entity';
import { GradeMetric } from '../../grade-metrics/entities/grade-metric.entity';
import { School } from '../../schools/entities/school.entity';
import { StudyPlanEnrollmentCost } from '../../financial/entities/study-plan-enrollment-cost.entity';

export class StudyPlan {
    id: string;
    degree: Degree;
    degreeId: string;
    school: School;
    name: string;
    shortName: string;
    level: number;
    description: string;
    schoolId: string;

    // Overrides of the degree's settings; null inherits (plan-settings.ts).
    gradeMetric?: GradeMetric | null;
    gradeMetricId: string | null;
    monthlyTuitionAmount?: Prisma.Decimal | null;
    tuitionStartMonth: number | null;
    tuitionEndMonth: number | null;

    enrollmentCosts?: StudyPlanEnrollmentCost[];

    createdAt: Date;
    updatedAt: Date;
}
