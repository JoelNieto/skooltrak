import { $Enums } from '@generated/prisma';
import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateAttendanceRecordInput } from './create-attendance-record.input';

@InputType()
export class UpdateAttendanceRecordInput extends PartialType(
  CreateAttendanceRecordInput,
) {
  @Field(() => String, { description: 'ID of the attendance record' })
  id: string;

  @Field(() => $Enums.AttendanceStatus, {
    description: 'Attendance status',
    nullable: true,
  })
  status?: $Enums.AttendanceStatus;

  @Field(() => String, { description: 'Optional comment', nullable: true })
  comment?: string;
}
