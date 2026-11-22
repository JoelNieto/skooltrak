/** `GET /v1/courses/mine` (ACA-001-S02, S03): the student's course cards and stats for one period. */

/** BR-ACA-001.5: "Al día" at or above the pass mark, "En riesgo" below it. */
export type MyCourseBand = 'AL_DIA' | 'EN_RIESGO';

export class MyCoursePeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export class MyCourseRef {
  id: string;
  name: string;
}

export class MyCourseSubject {
  name: string;
  icon: string | null;
  /** ACA-001 BR .14; null: the "Otras" chip. */
  area: string | null;
}

export class MyCourseTeacher {
  name: string;
  initials: string;
  color: string | null;
}

export class MyCourseScale {
  maximum: number;
  minimumApproval: number;
}

export class MyCourseCard {
  id: string;
  name: string;
  /** Resolved (ACA-001 BR .11): never null. */
  color: string;
  /** Presigned cover photo (FR .3); null: the color cover. */
  coverUrl: string | null;
  subject: MyCourseSubject;
  teacher: MyCourseTeacher | null;
  /** BR-ACA-001.9, e.g. "Lun, Mié, Vie · Aula 7"; null without slots for the student's group. */
  schedule: string | null;
  /** Period average on the plan's scale (BR-ASM-001.4, published grades only); null: "Sin notas". */
  average: number | null;
  band: MyCourseBand | null;
  /** Null when the plan has no grade scale: "Escala de notas no configurada". */
  scale: MyCourseScale | null;
  /** BR-ACA-001.8, current period only; null: "Nada pendiente" (or another period). */
  next: MyCourseNext | null;
  /** BR-ACA-001.7, in the selected period. */
  progress: MyCourseProgress;
}

export class MyCourseNext {
  assignmentId: string;
  title: string;
  /** ISO instant the work is due for the student's group. */
  dueAt: string;
  /** "Vencida desde {día}" when true; "Vence {día}, {hora}" otherwise. */
  overdue: boolean;
}

export class MyCourseProgress {
  done: number;
  total: number;
}

export class MyCoursesAverage {
  /** Mean of the course averages of the period (FR-HOM-001.13). */
  value: number | null;
  previous: number | null;
  delta: number | null;
}

export class MyCoursesWeek {
  /** Work due Monday to Sunday of this week, school time (BR-ACA-001.10). */
  due: number;
  overdue: number;
}

export class MyCoursesStats {
  average: MyCoursesAverage;
  week: MyCoursesWeek;
  /** Across all courses, in the selected period (BR-ACA-001.7). */
  done: number;
  total: number;
}

export class MyCourses {
  /** IANA timezone due times are shown in (BR-HOM-001.4). */
  timezone: string;
  /** The school's current year (FR-ACA-001.5). */
  periods: MyCoursePeriod[];
  /** The requested period, else the current one (BR-HOM-001.3). */
  periodId: string | null;
  /** Null: the student has no class group. */
  classGroup: MyCourseRef | null;
  /** The selected period is the current one: cards show *Próxima entrega* (FR-ACA-001.5). */
  isCurrentPeriod: boolean;
  /** Ordered by subject name (FR-ACA-001.4). */
  courses: MyCourseCard[];
  /** FR-ACA-001.6 */
  stats: MyCoursesStats;
}
