import { AssignmentType } from '@generated/prisma';

/**
 * Responses of `GET /v1/home/teacher/*` (HOM-001).
 * Dates are school-local `YYYY-MM-DD`; times are `HH:mm` in the school's timezone.
 */

/**
 * DONE: attendance recorded · NOW: in progress · LATER: not started ·
 * MISSED: ended without attendance (BR-HOM-001.15) · PAST: a recess that is over.
 */
export type TeacherSlotState = 'DONE' | 'NOW' | 'LATER' | 'MISSED' | 'PAST';

export class HomeRef {
  id: string;
  name: string;
}

export class HomePeriod {
  id: string;
  name: string;
  /** `YYYY-MM-DD` */
  endDate: string;
}

export class TeacherSlotAttendance {
  sessionId: string;
  /** PRESENT + LATE records. */
  presentOrLate: number;
  /** All records of the session. */
  total: number;
}

export class TeacherSlot {
  id: string;
  startTime: string;
  endTime: string;
  recess: boolean;
  remote: boolean;
  remoteLink: string;
  location: string;
  course: HomeRef;
  classGroup: HomeRef;
  state: TeacherSlotState;
  attendance: TeacherSlotAttendance | null;
}

export class TeacherToday {
  firstName: string;
  timezone: string;
  date: string;
  time: string;
  period: HomePeriod | null;
  slots: TeacherSlot[];
  /** Class slots (not recess) that are NOW or MISSED and have no attendance yet. */
  pendingAttendance: number;
}

export class TeacherGroupRate extends HomeRef {
  /** Fraction 0–1 (BR-HOM-001.5). */
  rate: number;
}

export class TeacherWeekAttendance {
  /** Fraction 0–1, or null when there are no countable records this week. */
  rate: number | null;
  /** Set only when two or more of the teacher's groups have a rate this week. */
  lowestGroup: TeacherGroupRate | null;
}

export class TeacherReviewTop {
  assignmentId: string;
  title: string;
  courseName: string;
  count: number;
}

/** Submissions with `reviewedAt` null on the teacher's assignments (BR-HOM-001.17). */
export class TeacherToReview {
  submissions: number;
  assignments: number;
  /** ISO instant of the oldest submission still to review. */
  oldestSubmittedAt: string | null;
  /** The assignment with the most submissions to review. */
  top: TeacherReviewTop | null;
}

/** Grade completeness of the teacher's courses in the current period (BR-HOM-001.3). */
export class TeacherGrades {
  periodId: string;
  /** Enrolled-student slots without a score, over all grades of the period. */
  emptyCells: number;
  coursesWithEmptyCells: number;
  /** Grades not yet published. */
  unpublished: number;
  coursesWithUnpublished: number;
  totalCourses: number;
  /** The course with the most empty cells, else with the most unpublished grades. */
  topCourseId: string | null;
}

/** Present when the current period ends within 14 days (FR-HOM-001.5). */
export class TeacherPeriodClose {
  name: string;
  endDate: string;
  daysLeft: number;
}

export class TeacherSummary {
  weekStart: string;
  weekEnd: string;
  attendance: TeacherWeekAttendance;
  toReview: TeacherToReview;
  /** Null when the school year has no current or past period. */
  grades: TeacherGrades | null;
  periodClose: TeacherPeriodClose | null;
}

export class TeacherWeekItem {
  assignmentId: string;
  title: string;
  type: AssignmentType;
  requireSubmission: boolean;
  course: HomeRef;
  classGroup: HomeRef;
  /** ISO instant the assignment is due for this group (`AssignmentDate.date`). */
  dueAt: string;
  /** Active students of the group enrolled in the course who have a submission. */
  submitted: number;
  /** Active students of the group enrolled in the course. */
  expected: number;
}

/** FR-HOM-001.9: assignments of the teacher's courses due this week, per class group. */
export class TeacherWeek {
  timezone: string;
  weekStart: string;
  weekEnd: string;
  items: TeacherWeekItem[];
}
