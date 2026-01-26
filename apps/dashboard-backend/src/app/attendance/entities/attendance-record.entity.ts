import { $Enums, Prisma } from '@generated/prisma';
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Student } from '../../students/entities/student.entity';
import { AttendanceSession } from './attendance-session.entity';

registerEnumType($Enums.AttendanceStatus, {
  name: 'AttendanceStatus',
  description: 'Status of attendance for a student',
});

@ObjectType()
export class AttendanceRecord
  implements
    Prisma.AttendanceRecordGetPayload<{
      include: { student: true; attendanceSession: true };
    }>
{
  @Field(() => String, { description: 'ID of the attendance record' })
  id: string;

  @Field(() => String, { description: 'Attendance session ID' })
  attendanceSessionId: string;

  @Field(() => AttendanceSession, {
    description: 'Attendance session',
    nullable: true,
  })
  attendanceSession: AttendanceSession;

  @Field(() => String, { description: 'Student ID' })
  studentId: string;

  @Field(() => Student, { description: 'Student of this record' })
  student: Student;

  @Field(() => $Enums.AttendanceStatus, { description: 'Attendance status' })
  status: $Enums.AttendanceStatus;

  @Field(() => String, { description: 'Optional comment', nullable: true })
  comment: string | null;

  @Field(() => Date, { description: 'Created at' })
  createdAt: Date;

  @Field(() => Date, { description: 'Updated at' })
  updatedAt: Date;
}
