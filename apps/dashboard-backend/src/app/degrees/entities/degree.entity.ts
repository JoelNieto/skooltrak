import { Prisma } from '@generated/prisma';
import { GradeMetric } from '../../grade-metrics/entities/grade-metric.entity';
import { School } from '../../schools/entities/school.entity';
import { StudyPlan } from '../../study-plans/entities/study-plan.entity';

export class DegreeEnrollmentCost {
    id: string;
    degreeId: string;
    name: string;
    amount: Prisma.Decimal;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

/** A degree (level); its grade metric and financial settings are the defaults of its study plans. */
export class Degree {
    id: string;

    studyPlans: StudyPlan[];

    name: string;

    shortName: string;

    schoolId: string;

    school: School;

    gradeMetric?: GradeMetric | null;
    gradeMetricId: string | null;
    monthlyTuitionAmount: Prisma.Decimal | null;
    tuitionStartMonth: number | null;
    tuitionEndMonth: number | null;
    enrollmentCosts?: DegreeEnrollmentCost[];

    createdAt: Date;

    updatedAt: Date;
}
