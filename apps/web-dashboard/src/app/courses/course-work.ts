import { BadgeTone } from '#/ui';

/** `GET /api/v1/courses/:id/work` (ACA-001-S06, FR .12 .13). */
export type WorkStatus = 'CALIFICADA' | 'EXENTA' | 'PENDIENTE' | 'ENTREGADO' | 'VENCIDA' | 'PRESENCIAL';
export type AssignmentType = 'HOMEWORK' | 'EXAM' | 'QUIZ' | 'PROJECT' | 'PAPER' | 'NEW';

export interface CourseWorkItem {
  assignmentId: string;
  title: string;
  type: AssignmentType;
  dueAt: string;
  status: WorkStatus;
  score: number | null;
}

export interface CourseWork {
  timezone: string;
  pending: number;
  upcoming: CourseWorkItem[];
  past: CourseWorkItem[];
}

export const WORK_TYPES: Record<AssignmentType, { label: string; icon: 'clipboard-list' | 'file-text' | 'notebook-pen' | 'book-open' }> = {
  NEW: { label: 'Asignación', icon: 'clipboard-list' },
  HOMEWORK: { label: 'Tarea', icon: 'notebook-pen' },
  EXAM: { label: 'Examen', icon: 'file-text' },
  PROJECT: { label: 'Proyecto', icon: 'clipboard-list' },
  QUIZ: { label: 'Quiz', icon: 'file-text' },
  PAPER: { label: 'Ensayo', icon: 'book-open' },
};

/** BR-ACA-001.6 pills. */
export function workPill(item: CourseWorkItem): { label: string; tone: BadgeTone } {
  switch (item.status) {
    case 'CALIFICADA':
      return { label: item.score === null ? 'Calificada' : `Calificada · ${item.score.toFixed(1)}`, tone: 'success' };
    case 'EXENTA':
      return { label: 'Exenta', tone: 'neutral' };
    case 'ENTREGADO':
      return { label: 'Entregada', tone: 'success' };
    case 'VENCIDA':
      return { label: 'Vencida', tone: 'danger' };
    case 'PRESENCIAL':
      return { label: 'Presencial', tone: 'neutral' };
    default:
      return { label: 'Pendiente', tone: 'warning' };
  }
}

/** "jue, 16 abr, 12:00" in school time. */
export function workDate(item: { dueAt: string }, timezone: string): string {
  return new Intl.DateTimeFormat('es', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  }).format(new Date(item.dueAt));
}
