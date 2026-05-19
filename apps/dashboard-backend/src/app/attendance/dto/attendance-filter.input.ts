export class AttendanceFilterInput {
    courseId: string;

    classGroupId?: string;

    startDate?: Date;

    endDate?: Date;

    skip?: number;

    take?: number;
}
