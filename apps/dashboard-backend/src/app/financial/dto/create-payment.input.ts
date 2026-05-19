export class CreatePaymentInput {
    studentId: string;

    amount: number;

    paidAt: Date;

    reference?: string;

    createdBy?: string;
}
