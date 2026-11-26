import { GradeMetric } from '../../grade-metrics/entities/grade-metric.entity';
import { School } from '../../schools/entities/school.entity';
import { StudyPlan } from '../../study-plans/entities/study-plan.entity';

/** A degree (level); its grade metric is the default of its study plans. */
export class Degree {
    id: string;

    studyPlans: StudyPlan[];

    name: string;

    shortName: string;

    schoolId: string;

    school: School;

    gradeMetric?: GradeMetric | null;
    gradeMetricId: string | null;

    createdAt: Date;

    updatedAt: Date;
}
