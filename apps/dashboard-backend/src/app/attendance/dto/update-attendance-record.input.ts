import { $Enums } from '@generated/prisma';
import { PartialType } from '@nestjs/swagger';
import { CreateAttendanceRecordInput } from './create-attendance-record.input';

export class UpdateAttendanceRecordInput extends PartialType(
  CreateAttendanceRecordInput,
) {
    id: string;

    status?: $Enums.AttendanceStatus;

    comment?: string;
}
