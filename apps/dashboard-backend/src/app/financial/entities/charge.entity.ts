import { $Enums, Prisma } from '@generated/prisma';
import { School } from '../../schools/entities/school.entity';
import { Student } from '../../students/entities/student.entity';
import { StudyPlan } from '../../study-plans/entities/study-plan.entity';

export class Charge {
    id: string;

    schoolId: string;

    school: School;

    year: number;

    studentId: string;

    student: Student;

    studyPlanId: string | null;

    studyPlan: StudyPlan | null;

    amount: Prisma.Decimal;

    dueDate: Date;

    description: string;

    chargeType: $Enums.ChargeType;

    status: $Enums.ChargeStatus;

    createdAt: Date;

    updatedAt: Date;
}
