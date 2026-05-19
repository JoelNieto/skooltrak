import { Course } from '../../courses/entities/course.entity';
import { Student } from '../../students/entities/student.entity';
import { StudyPlan } from '../../study-plans/entities/study-plan.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
export class ClassGroup {
    id: string;
    name: string;
    organizationId: string;
    schoolId: string;
    active: boolean;
    teacherId: string;
    studyPlanId: string;
    teacher: Teacher;
    studyPlan: StudyPlan;
    students: Student[];
    courses: Course[];
    createdAt: Date;
    updatedAt: Date;
}
