export class EnrollmentCostInput {
    id?: string;

    name: string;

    amount: number;

    order: number;
}

export class UpdateStudyPlanFinancialInput {
    studyPlanId: string;

    monthlyTuitionAmount?: number;

    tuitionMonths?: number[];

    enrollmentCosts?: EnrollmentCostInput[];
}
