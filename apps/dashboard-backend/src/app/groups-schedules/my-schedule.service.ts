import { AuthUserContext } from '@/auth';
import { WeekDay } from '@generated/prisma';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { NO_STUDENT, NOT_LINKED } from '../courses/courses-mine.service';
import { Clock, CLOCK, schoolLocalTime } from '../home/home-time';
import { PrismaService } from '../prisma.service';
import { teacherCourseWhere } from '../teachers/teacher-scope';

export const NO_SCHEDULE_PROFILE = 'No tienes un horario en esta organización';

export interface MyScheduleSlot {
  id: string;
  weekday: WeekDay;
  startTime: string;
  endTime: string;
  location: string;
  remote: boolean;
  remoteLink: string;
  recess: boolean;
  course: {
    id: string;
    name: string;
    shortName: string;
    code: string;
    color: string | null;
    subject: { name: string; code: string } | null;
  };
  teacherName: string | null;
  group: { id: string; name: string };
}

/**
 * A read-only weekly schedule. STUDENT: the student's group (also what a parent sees for a linked
 * child). TEACHER: the teacher's classes in every active group of the organization.
 */
export interface MySchedule {
  kind: 'STUDENT' | 'TEACHER';
  /** The student's or teacher's name. */
  name: string;
  /** STUDENT: the group; null while the student has none. */
  group: { id: string; name: string } | null;
  /** The school's local day and time, so "now" doesn't depend on the device's clock. */
  now: { weekday: WeekDay; time: string };
  slots: MyScheduleSlot[];
}

const SLOT_SELECT = {
  id: true,
  weekday: true,
  startTime: true,
  endTime: true,
  location: true,
  remote: true,
  remoteLink: true,
  recess: true,
  classGroup: { select: { id: true, name: true } },
  course: {
    select: {
      id: true,
      name: true,
      shortName: true,
      code: true,
      color: true,
      subject: { select: { name: true, code: true } },
      teacher: { select: { user: { select: { firstName: true, lastName: true } } } },
      school: { select: { timezone: true } },
    },
  },
} as const;

type SlotRow = {
  id: string;
  weekday: WeekDay;
  startTime: string;
  endTime: string;
  location: string;
  remote: boolean;
  remoteLink: string;
  recess: boolean;
  classGroup: { id: string; name: string };
  course: {
    id: string;
    name: string;
    shortName: string;
    code: string;
    color: string | null;
    subject: { name: string; code: string } | null;
    teacher: { user: { firstName: string; lastName: string } | null } | null;
    school: { timezone: string | null };
  };
};

const ORDER = { orderBy: [{ weekday: 'asc' as const }, { startTime: 'asc' as const }] };

function toSlot(row: SlotRow): MyScheduleSlot {
  const user = row.course.teacher?.user;
  return {
    id: row.id,
    weekday: row.weekday,
    startTime: row.startTime,
    endTime: row.endTime,
    location: row.location,
    remote: row.remote,
    remoteLink: row.remoteLink,
    recess: row.recess,
    course: {
      id: row.course.id,
      name: row.course.name,
      shortName: row.course.shortName,
      code: row.course.code,
      color: row.course.color,
      subject: row.course.subject,
    },
    teacherName: user ? `${user.firstName} ${user.lastName}`.trim() : null,
    group: row.classGroup,
  };
}

@Injectable()
export class MyScheduleService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /**
   * The caller's own group as a student; with `studentId`, a parent's linked child (any
   * organization); otherwise the caller's classes as a teacher. A student's `studentId` is ignored.
   */
  async mine(user: AuthUserContext | undefined, studentId?: string): Promise<MySchedule> {
    if (!user?.userId) throw new ForbiddenException('Not authenticated');
    const student = await this.resolveStudent(user, studentId);
    if (student) return this.studentSchedule(student);
    if (studentId) throw new ForbiddenException(NOT_LINKED);

    const teacher = user.organizationId
      ? await this.prisma.teacher.findFirst({
          where: { userId: user.userId, organizationId: user.organizationId },
          select: { id: true, firstName: true, fatherName: true },
        })
      : null;
    if (!teacher)
      throw new ForbiddenException(user.role?.toUpperCase() === 'STUDENT' ? NO_STUDENT : NO_SCHEDULE_PROFILE);

    const rows = (await this.prisma.classGroupWeeklySchedule.findMany({
      where: {
        recess: false,
        course: { organizationId: user.organizationId as string, ...teacherCourseWhere(teacher.id) },
        classGroup: { organizationId: user.organizationId as string, active: true },
      },
      select: SLOT_SELECT,
      ...ORDER,
    })) as SlotRow[];
    // A teacher has no school of their own: use the school of their classes.
    const timezone = rows[0]?.course.school.timezone;
    return {
      kind: 'TEACHER',
      name: `${teacher.firstName} ${teacher.fatherName}`.trim(),
      group: null,
      now: this.now(timezone),
      slots: rows.map(toSlot),
    };
  }

  private async resolveStudent(user: AuthUserContext, studentId: string | undefined) {
    const select = {
      id: true,
      firstName: true,
      fatherName: true,
      classGroup: { select: { id: true, name: true } },
      school: { select: { timezone: true } },
    } as const;
    const own = user.organizationId
      ? await this.prisma.student.findFirst({
          where: { userId: user.userId, organizationId: user.organizationId },
          select,
        })
      : null;
    if (own || !studentId) return own;
    return this.prisma.student.findFirst({
      where: { id: studentId, parents: { some: { userId: user.userId } } },
      select,
    });
  }

  private async studentSchedule(student: {
    firstName: string;
    fatherName: string;
    classGroup: { id: string; name: string } | null;
    school: { timezone: string | null } | null;
  }): Promise<MySchedule> {
    const rows = student.classGroup
      ? ((await this.prisma.classGroupWeeklySchedule.findMany({
          where: { classGroupId: student.classGroup.id },
          select: SLOT_SELECT,
          ...ORDER,
        })) as SlotRow[])
      : [];
    return {
      kind: 'STUDENT',
      name: `${student.firstName} ${student.fatherName}`.trim(),
      group: student.classGroup,
      now: this.now(student.school?.timezone),
      slots: rows.map(toSlot),
    };
  }

  private now(timezone: string | null | undefined) {
    const local = schoolLocalTime(this.clock.now(), timezone);
    return { weekday: local.weekday, time: local.time };
  }
}
