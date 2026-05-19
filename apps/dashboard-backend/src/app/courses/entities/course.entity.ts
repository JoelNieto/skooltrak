import { Grade } from '../../grades/entities/grade.entity';
import { School } from '../../schools/entities/school.entity';
import { StudyPlan } from '../../study-plans/entities/study-plan.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
export class Course {
    id: string;

    school: School;

    subject: Subject;

    studyPlan: StudyPlan;

    name: string;

    code: string;

    shortName: string;

    organizationId: string;

    schoolId: string;

    subjectId: string;

    studyPlanId: string;

    grades: Grade[];

    teacherId: string;

    teacher: Teacher;

    createdAt: Date;

    updatedAt: Date;
}
