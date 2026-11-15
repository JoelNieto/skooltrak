import { HomeRef } from './teacher-home.entity';

/** Responses of `GET /v1/home/admin/*` (HOM-001). Dates are school-local `YYYY-MM-DD`. */

export class AdminPeriodClose {
  name: string;
  endDate: string;
  daysLeft: number;
  /** Courses of the school with at least one empty score cell this period. */
  coursesWithMissingGrades: number;
  totalCourses: number;
}

/** FR-HOM-001.24. Counts are 0 when there is nothing to do; the UI hides those tiles. */
export class AdminAttentionTiles {
  joinRequests: { total: number; teachers: number; parents: number; others: number; oldestAt: string | null };
  broadcastsToApprove: number;
  /** Today's classes already started without attendance (BR-HOM-001.15). */
  missedAttendance: number;
  /** Null without VIEW_FINANCIALS (BR-HOM-001.16). */
  overdueCharges: { count: number; amount: number; families: number } | null;
  /** FAILED or with errors, last 30 days. */
  failedImports: number;
  plansWithoutScale: number;
}

export class AdminAttention {
  firstName: string;
  school: HomeRef;
  timezone: string;
  date: string;
  time: string;
  period: HomeRef | null;
  periodClose: AdminPeriodClose | null;
  currencyCode: string;
  tiles: AdminAttentionTiles;
}

/** FR-HOM-001.25 */
export class AdminKpis {
  students: { active: number; candidates: number };
  /** BR-HOM-001.5 rates (0–1); null without records. */
  attendanceToday: { rate: number | null; absent: number; late: number; lastWeekRate: number | null };
  /** Payments on charges due this month ÷ their amount; null without VIEW_FINANCIALS. */
  collection: { rate: number | null; collected: number; billed: number } | null;
  /** Null without a period. */
  passing: {
    /** Students with at least one average in a course that has a scale. */
    evaluated: number;
    /** Share of those with no average below the pass mark (0–1); null when none evaluated. */
    rate: number | null;
    belowPass: number;
    allExcellent: number;
  } | null;
  currencyCode: string;
}
