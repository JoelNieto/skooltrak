import { $Enums, Prisma } from '@generated/prisma';
export class CreateAssignmentInput implements Prisma.AssignmentUncheckedCreateInput {
    title: string;
    details: string;
    type: $Enums.AssignmentType;
    date: string | Date;
    schoolId: string;
    courseId: string;
    requireSubmission: boolean;
    teacherId: string;

    groupDates?: AssignmentDateInput[];
}

export class AssignmentDateInput {
    date: Date;
    classGroupId: string;
}
