import { $Enums } from '@generated/prisma';
export class CreateChargeInput {
    schoolId: string;

    year: number;

    studentId?: string;

    studyPlanId?: string;

    amount: number;

    dueDate: Date;

    description?: string;

    chargeType?: $Enums.ChargeType;
}
