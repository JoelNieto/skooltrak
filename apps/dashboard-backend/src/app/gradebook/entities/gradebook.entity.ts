/**
 * Responses of `GET /v1/gradebook/*` (ASM-001-S02). Scores and weights are numbers; dates are
 * ISO strings. Every average follows BR-ASM-001.4 (`courseAverage` in `@/shared`) and includes
 * draft columns (BR .6).
 */

/** BR-ASM-001.5: AT_RISK "En riesgo" · WATCH "Atención" · ON_TRACK "Al día". */
export type GradebookStatus = 'AT_RISK' | 'WATCH' | 'ON_TRACK';

export class GradebookCourse {
  id: string;
  name: string;
  /** Last change to one of the course's grade columns or scores; null when never graded. */
  lastGradedAt: string | null;
}

export class GradebookCourses {
  /** Most recently graded first, then by name (FR-ASM-001.1). */
  courses: GradebookCourse[];
}

export class GradebookMetric {
  minimum: number;
  maximum: number;
  /** Pass mark. */
  minimumApproval: number;
  minimumExcellence: number;
}

export class GradebookPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export class GradebookGroup {
  /** Null: students without a class group ("Sin grupo"); select it with `classGroupId=none`. */
  id: string | null;
  name: string;
  studentCount: number;
}

export class GradebookColumn {
  id: string;
  title: string;
  date: string;
  published: boolean;
}

export class GradebookBucket {
  id: string;
  name: string;
  weight: number;
  /** The period's columns of this bucket, by date then title. */
  columns: GradebookColumn[];
}

export class GradebookCell {
  gradeId: string;
  /** Null until the first score is saved for this student and column. */
  studentGradeId: string | null;
  score: number | null;
  updatedAt: string | null;
}

export class GradebookStudent {
  id: string;
  firstName: string;
  name: string;
  initials: string;
  color: string | null;
}

export class GradebookRow {
  student: GradebookStudent;
  /** One per column, in the order of `buckets[].columns`. */
  cells: GradebookCell[];
  average: number | null;
  status: GradebookStatus | null;
}

export class GradebookColumnAverage {
  gradeId: string;
  /** Mean of the column's scored cells in the group. */
  average: number | null;
}

export class GradebookFooter {
  columns: GradebookColumnAverage[];
  /** Mean of the students' averages (students without one are left out). */
  average: number | null;
}

export class GradebookCourseRef {
  id: string;
  name: string;
}

export class Gradebook {
  course: GradebookCourseRef;
  /** Null when the study plan has no grade metric: no status bands (BR-HOM-001.1). */
  metric: GradebookMetric | null;
  /** The school's current year. */
  periods: GradebookPeriod[];
  /** The selected period: the requested one, else the current one (BR-HOM-001.3). */
  periodId: string | null;
  /** Groups the course's roster spans, by name ("Sin grupo" last). */
  classGroups: GradebookGroup[];
  /** The selected group: the requested one, else the first. */
  classGroupId: string | null;
  buckets: GradebookBucket[];
  /** Students of the selected group on the roster, by first name. */
  rows: GradebookRow[];
  footer: GradebookFooter;
  /** A draft column has a score in this group, so averages include drafts (BR-ASM-001.6). */
  includesDrafts: boolean;
}

/** A cell as stored after a save, or as stored now when a save conflicts (ASM-001-S03). */
export class GradebookSavedCell {
  gradeId: string;
  studentId: string;
  studentGradeId: string | null;
  score: number | null;
  updatedAt: string | null;
}

export class GradebookSavedCells {
  cells: GradebookSavedCell[];
}
