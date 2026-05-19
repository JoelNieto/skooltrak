import { $Enums } from '@generated/prisma';
export class CreateAttendanceRecordInput {
    studentId: string;

    status: $Enums.AttendanceStatus;

    comment?: string;
}
