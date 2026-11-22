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
