import { Prisma } from '@generated/prisma';
import { ClassGroup } from '../../class-groups/entities/class-group.entity';
import { Course } from '../../courses/entities/course.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
import { AttendanceRecord } from './attendance-record.entity';

export class AttendanceSession
  implements
    Prisma.AttendanceSessionGetPayload<{
      include: {
        course: true;
        classGroup: true;
        teacher: true;
        records: { include: { student: true } };
      };
    }>
{
    id: string;

    date: Date;

    courseId: string;

    course: Course;

    classGroupId: string;

    classGroup: ClassGroup;

    teacherId: string;

    teacher: Teacher;

    organizationId: string;

    records: AttendanceRecord[];

    createdAt: Date;

    updatedAt: Date;
}
