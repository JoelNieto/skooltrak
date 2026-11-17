import { AssignmentType } from '@generated/prisma';
import { HomePeriod, HomeRef } from './teacher-home.entity';
import type { TimeState } from '../home-schedule';

/**
 * Responses of `GET /v1/home/student/*` (HOM-001).
 * Dates are school-local `YYYY-MM-DD`; times are `HH:mm` in the school's timezone.
 */

export class StudentSlot {
  id: string;
  startTime: string;
  endTime: string;
  recess: boolean;
  remote: boolean;
  remoteLink: string;
  location: string;
  course: HomeRef;
  /** "Carlos Méndez", or null when the course has no teacher. */
  teacherName: string | null;
  state: TimeState;
}

/** FR-HOM-001.12 */
export class StudentToday {
  firstName: string;
  timezone: string;
  date: string;
  time: string;
  period: HomePeriod | null;
  /** Null when the student has no class group (BR-HOM-001.8). */
  classGroup: HomeRef | null;
  /** The class in progress, if any (recess excluded). */
  now: StudentSlot | null;
  /** The next class starting later today (recess excluded). */
  next: StudentSlot | null;
  slots: StudentSlot[];
}

/** BR-HOM-001.12 */
export type StudentWorkStatus = 'PENDIENTE' | 'ENTREGADO' | 'VENCIDA' | 'PRESENCIAL';

export class StudentWorkItem {
  assignmentId: string;
  title: string;
  type: AssignmentType;
  requireSubmission: boolean;
  course: HomeRef;
  /** ISO instant the work is due for the student's group (`AssignmentDate.date`). */
  dueAt: string;
  status: StudentWorkStatus;
  /** ISO instant of the student's submission, if any. */
  submittedAt: string | null;
}

/** FR-HOM-001.14: due from today to +14 days, plus overdue work of the last 7 days. */
export class StudentWork {
  timezone: string;
  today: string;
  /** Null when the student has no class group. */
  classGroup: HomeRef | null;
  /** Overdue first (oldest first), then by due date. */
  items: StudentWorkItem[];
}
