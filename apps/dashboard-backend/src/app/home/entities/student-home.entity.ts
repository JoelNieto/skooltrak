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

/**
 * BR-HOM-001.12, extended by BR-ACA-001.6: CALIFICADA / EXENTA when the assignment's linked grade
 * (ASM-001 FR .11) is published and the student is scored / excused in it (FR-ACA-001.17).
 */
export type StudentWorkStatus = 'CALIFICADA' | 'EXENTA' | 'PENDIENTE' | 'ENTREGADO' | 'VENCIDA' | 'PRESENCIAL';

export class StudentWorkItem {
  assignmentId: string;
  title: string;
  type: AssignmentType;
  requireSubmission: boolean;
  course: HomeRef;
  /** ISO instant the work is due for the student's group (`AssignmentDate.date`). */
  dueAt: string;
  status: StudentWorkStatus;
  /** The published score when CALIFICADA; null otherwise. */
  score: number | null;
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

export type GradeBandValue = 'EXCELLENT' | 'PASSING' | 'BELOW';

export class StudentScale {
  maximum: number;
  minimumApproval: number;
  minimumExcellence: number;
}

export class StudentCourseAverage {
  id: string;
  name: string;
  /** Weighted average of published scores this period, one decimal; null without scored grades. */
  average: number | null;
  /** Null without an average or without a scale. */
  band: GradeBandValue | null;
}

export class StudentRecentGrade {
  id: string;
  title: string;
  course: HomeRef;
  score: number;
  band: GradeBandValue | null;
  /** ISO instant of the grade. */
  date: string;
}

export class StudentHabitFlag {
  name: string;
  /** R (regular) or X (bad). */
  value: 'R' | 'X';
}

export class StudentHabits {
  total: number;
  /** Marks with value S. */
  satisfactory: number;
  flagged: StudentHabitFlag[];
}

/** FR-HOM-001.13, .16, .17 */
export class StudentProgress {
  studentId: string;
  period: HomeRef | null;
  previousPeriod: HomeRef | null;
  /** The student's study plan grade metric; null when not configured (BR-HOM-001.1). */
  scale: StudentScale | null;
  average: {
    /** Mean of this period's course averages, one decimal. */
    value: number | null;
    previous: number | null;
    /** value − previous, one decimal, when both exist. */
    delta: number | null;
  };
  courses: StudentCourseAverage[];
  recentGrades: StudentRecentGrade[];
  /** BR-HOM-001.5 over the period up to today; null without a period. */
  attendance: { rate: number | null; absences: number; late: number } | null;
  /** COM-003 FR .15: unread channel posts (students have no direct messages). */
  messages: { unread: number };
  /** Published habit marks of the current period; null without a period or class group. */
  habits: StudentHabits | null;
}
