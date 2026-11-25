import { Prisma } from '@generated/prisma';
import { effectiveGradeMetric, planMetricSelect } from '../study-plans/plan-settings';

/**
 * ASM-001 BR .12: when a published score is below the pass mark, the homeroom teacher of the
 * student's group gets an in-app notification, once per (student, grade). The course's teacher and
 * whoever saved or published the score get none. Call it after the write has committed.
 */
export const LOW_GRADE_ALERT = 'LOW_GRADE_HOMEROOM';
export const LOW_GRADE_ALERT_TITLE = 'Nota bajo la nota mínima';

type AlertDb = {
  grade: Pick<Prisma.TransactionClient['grade'], 'findUnique'>;
  notification: Pick<Prisma.TransactionClient['notification'], 'findMany' | 'createMany'>;
};

type Decimalish = { toNumber(): number } | number;
const num = (v: Decimalish) => (typeof v === 'number' ? v : v.toNumber());
const oneDecimal = (n: number) => (Math.round(n * 10) / 10).toFixed(1);

export const alertKey = (gradeId: string, studentId: string) => `${gradeId}:${studentId}`;

/**
 * Sends the alerts a published grade calls for, for all its students or only `studentIds`.
 * Returns how many were sent.
 */
export async function alertHomeroomTeachers(
  db: AlertDb,
  gradeId: string,
  opts: { studentIds?: string[]; actorUserId?: string | null } = {},
): Promise<number> {
  const grade = await db.grade.findUnique({
    where: { id: gradeId },
    select: {
      title: true,
      published: true,
      course: {
        select: {
          name: true,
          teacher: { select: { userId: true } },
          studyPlan: { select: planMetricSelect({ minimumApproval: true }) },
        },
      },
      studentGrades: {
        where: {
          excused: false,
          score: { not: null },
          ...(opts.studentIds ? { studentId: { in: opts.studentIds } } : {}),
        },
        select: {
          studentId: true,
          score: true,
          student: {
            select: {
              firstName: true,
              fatherName: true,
              classGroup: { select: { name: true, teacher: { select: { userId: true } } } },
            },
          },
        },
      },
    },
  });
  const passMark = effectiveGradeMetric(grade?.course.studyPlan)?.minimumApproval;
  if (!grade?.published || passMark === undefined || passMark === null) return 0;
  const pass = num(passMark);
  const graders = new Set([grade.course.teacher?.userId, opts.actorUserId].filter((id): id is string => !!id));

  const candidates = grade.studentGrades.filter((sg) => {
    const homeroom = sg.student.classGroup?.teacher?.userId;
    return sg.score !== null && num(sg.score) < pass && !!homeroom && !graders.has(homeroom);
  });
  if (!candidates.length) return 0;

  // Once per (student, grade), even if the score changes again.
  const keys = candidates.map((sg) => alertKey(gradeId, sg.studentId));
  const sent = await db.notification.findMany({
    where: { type: LOW_GRADE_ALERT, relatedId: { in: keys } },
    select: { relatedId: true },
  });
  const already = new Set(sent.map((n) => n.relatedId));
  const fresh = candidates.filter((sg) => !already.has(alertKey(gradeId, sg.studentId)));
  if (!fresh.length) return 0;

  await db.notification.createMany({
    data: fresh.map((sg) => {
      const group = sg.student.classGroup?.name;
      const name = `${sg.student.firstName} ${sg.student.fatherName}`;
      return {
        recipientId: sg.student.classGroup?.teacher?.userId as string,
        type: LOW_GRADE_ALERT,
        title: LOW_GRADE_ALERT_TITLE,
        message: `${name}${group ? ` (${group})` : ''} obtuvo ${oneDecimal(num(sg.score as Decimalish))} en «${grade.title}» de ${grade.course.name}. Nota mínima: ${oneDecimal(pass)}.`,
        relatedId: alertKey(gradeId, sg.studentId),
      };
    }),
  });
  return fresh.length;
}

/** Runs the alerts without making the caller wait or fail; errors are logged with ids only. */
export function alertInBackground(
  db: AlertDb,
  gradeId: string,
  opts: { studentIds?: string[]; actorUserId?: string | null } = {},
): void {
  alertHomeroomTeachers(db, gradeId, opts).catch((error) =>
    console.error(`[HomeroomAlerts] alerts failed for grade ${gradeId}`, error),
  );
}
