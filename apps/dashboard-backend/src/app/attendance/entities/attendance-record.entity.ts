import { $Enums, Prisma } from '@generated/prisma';
import { Student } from '../../students/entities/student.entity';
import { AttendanceSession } from './attendance-session.entity';

export class AttendanceRecord
  implements
    Prisma.AttendanceRecordGetPayload<{
      include: { student: true; attendanceSession: true };
    }>
{
    id: string;

    attendanceSessionId: string;

    attendanceSession: AttendanceSession;

    studentId: string;

    student: Student;

    status: $Enums.AttendanceStatus;

    comment: string | null;

    createdAt: Date;

    updatedAt: Date;
}
