import { School } from '../../schools/entities/school.entity';
import { StudyPlan } from '../../study-plans/entities/study-plan.entity';
export class Degree {
    id: string;

    studyPlans: StudyPlan[];

    name: string;

    shortName: string;

    schoolId: string;

    school: School;

    createdAt: Date;

    updatedAt: Date;
}
