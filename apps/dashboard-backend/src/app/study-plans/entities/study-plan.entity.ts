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

    gradeMetric: GradeMetric;
    gradeMetricId: string;
    monthlyTuitionAmount?: Prisma.Decimal | null;

    tuitionMonths: number[];

    enrollmentCosts?: StudyPlanEnrollmentCost[];

    createdAt: Date;
    updatedAt: Date;
}
