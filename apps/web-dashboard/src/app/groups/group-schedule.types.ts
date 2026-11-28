import { Prisma } from '@generated/prisma';
import { WeekdayKey } from './schedule-grid';

/** A weekly slot as `GET /groups-schedules/by-class-group/:id` returns it. */
export type Schedule = Prisma.ClassGroupWeeklyScheduleGetPayload<{
  include: {
    course: { include: { subject: true; teacher: { include: { user: true } } } };
  };
}>;

/** A course of the group (its study plan's courses), as `GET /courses/by-group/:id` returns it. */
export type GroupCourse = Prisma.CourseGetPayload<{
  include: { subject: true; teacher: { include: { user: true } } };
}>;

/** Another group's slot taught by one of this group's teachers (`…/teacher-busy`). */
export interface TeacherBusySlot {
  id: string;
  weekday: WeekdayKey;
  startTime: string;
  endTime: string;
  teacherId: string;
  groupName: string;
}

/** What the class form starts from. */
export interface ScheduleDraft {
  courseId: string;
  weekdays: WeekdayKey[];
  startTime: string;
  endTime: string;
  location: string;
  remote: boolean;
  remoteLink: string;
}

export function teacherName(teacher: { user?: { firstName: string; lastName: string } | null } | null | undefined) {
  const user = teacher?.user;
  return user ? `${user.firstName} ${user.lastName}`.trim() : 'Sin docente';
}

export function subjectName(course: { name: string; subject?: { name: string } | null }) {
  return course.subject?.name ?? course.name;
}

/** Short code for the block's chip: the subject's code, else the course's short name. */
export function courseCode(course: {
  shortName?: string | null;
  code?: string | null;
  subject?: { code?: string | null } | null;
}) {
  return (course.subject?.code || course.shortName || course.code || '').slice(0, 6).toUpperCase();
}
