import { AssignmentType } from '@generated/prisma';
import { StudentWorkStatus } from '../../home/entities/student-home.entity';

/** Course page data for students and parents (ACA-001-S06). */

export class CoursePageSchedule {
  /** "Lun, Mié, Vie" or "Todos los días". */
  days: string;
  place: string | null;
  /** "7:00–7:45" when every slot shares it. */
  times: string | null;
}

export class CourseWorkItem {
  assignmentId: string;
  title: string;
  type: AssignmentType;
  /** ISO instant the work is due for the student's group. */
  dueAt: string;
  /** BR-ACA-001.6 */
  status: StudentWorkStatus;
  /** The published score when CALIFICADA. */
  score: number | null;
}

/** `GET /v1/courses/:id/work` (FR-ACA-001.12, .13). */
export class CourseWork {
  timezone: string;
  /** Pendiente + Vencida: the "{n} pendientes" of the Asignaciones tab. */
  pending: number;
  /** Due now or later, soonest first. */
  upcoming: CourseWorkItem[];
  /** Before now, most recent first. */
  past: CourseWorkItem[];
}

/** `GET /v1/courses/:id/grades-summary` (ACA-001-S07, FR .14). Published grades only (BR-HOM-001.2). */
export class CourseGradesPeriod {
  id: string;
  name: string;
}

export class CourseGradesScale {
  maximum: number;
  minimumApproval: number;
}

export class CourseGradesBucket {
  id: string;
  name: string;
  weight: number;
  /** Mean of the student's scored cells in this category; null without one. */
  average: number | null;
}

export class CourseGradesRow {
  id: string;
  title: string;
  bucket: string;
  date: string;
  /** The teacher's comment on the student's cell. */
  comment: string | null;
  score: number | null;
  excused: boolean;
}

export class CourseGradesSummary {
  periods: CourseGradesPeriod[];
  periodId: string | null;
  /** Null: "Escala de notas no configurada". */
  scale: CourseGradesScale | null;
  /** BR-ASM-001.4 over the period's published grades; null: "Sin notas". */
  average: number | null;
  /** BR-ACA-001.5 */
  band: 'AL_DIA' | 'EN_RIESGO' | null;
  /** Every category of the course, in creation order. */
  buckets: CourseGradesBucket[];
  /** The period's published grades, most recent first. */
  grades: CourseGradesRow[];
}

/** `GET /v1/courses/:id/participants` (ACA-001-S08, FR .15, BR .13). */
export class CourseParticipantTeacher {
  id: string;
  name: string;
  initials: string;
  color: string | null;
  /** "Docente" (the course's teacher) and/or "Docente consejero" (the student's homeroom teacher). */
  roles: string[];
}

/** Names and initials only: never email, codes or contact details (BR .13). */
export class CourseParticipantStudent {
  id: string;
  name: string;
  initials: string;
}

export class CourseParticipants {
  teachers: CourseParticipantTeacher[];
  /** Empty for parents (BR .13); a homeroom teacher gets their group's students only (BR .16). */
  students: CourseParticipantStudent[];
  /** The head count on the tab: everyone listed. */
  count: number;
}
