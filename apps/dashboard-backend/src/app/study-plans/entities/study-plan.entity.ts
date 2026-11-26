import { Degree } from '../../degrees/entities/degree.entity';
import { GradeMetric } from '../../grade-metrics/entities/grade-metric.entity';
import { School } from '../../schools/entities/school.entity';

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

    createdAt: Date;
    updatedAt: Date;
}
