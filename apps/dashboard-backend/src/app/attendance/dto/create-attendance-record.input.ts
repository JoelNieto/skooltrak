import { $Enums } from '@generated/prisma';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateAttendanceRecordInput {
  @Field(() => String, { description: 'Student ID' })
  studentId: string;

  @Field(() => $Enums.AttendanceStatus, { description: 'Attendance status' })
  status: $Enums.AttendanceStatus;

  @Field(() => String, { description: 'Optional comment', nullable: true })
  comment?: string;
}
