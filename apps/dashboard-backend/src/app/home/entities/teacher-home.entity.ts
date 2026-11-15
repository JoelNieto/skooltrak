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

export class TeacherSummary {
  weekStart: string;
  weekEnd: string;
  attendance: TeacherWeekAttendance;
}
