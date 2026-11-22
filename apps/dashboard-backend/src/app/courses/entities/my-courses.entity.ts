/** `GET /v1/courses/mine` (ACA-001-S02): the student's course cards for one period. */

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
  subject: MyCourseSubject;
  teacher: MyCourseTeacher | null;
  /** BR-ACA-001.9, e.g. "Lun, Mié, Vie · Aula 7"; null without slots for the student's group. */
  schedule: string | null;
  /** Period average on the plan's scale (BR-ASM-001.4, published grades only); null: "Sin notas". */
  average: number | null;
  band: MyCourseBand | null;
  /** Null when the plan has no grade scale: "Escala de notas no configurada". */
  scale: MyCourseScale | null;
}

export class MyCourses {
  /** The school's current year (FR-ACA-001.5). */
  periods: MyCoursePeriod[];
  /** The requested period, else the current one (BR-HOM-001.3). */
  periodId: string | null;
  /** Null: the student has no class group. */
  classGroup: MyCourseRef | null;
  /** Ordered by subject name (FR-ACA-001.4). */
  courses: MyCourseCard[];
}
