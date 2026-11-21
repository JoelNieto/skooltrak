import { alertHomeroomTeachers, LOW_GRADE_ALERT } from './homeroom-alerts';

/** ASM-001-S08 — homeroom alerts for published scores below the pass mark (BR-ASM-001.12). */
const d = (n: number) => ({ toNumber: () => n });
type Row = { studentId: string; score: number | null; excused?: boolean; first: string; group: { name: string; homeroom: string | null } | null };

function setup(opts: { published?: boolean; pass?: number | null; rows: Row[]; courseTeacher?: string; sent?: string[] }) {
  const created: { recipientId: string; type: string; message: string; relatedId: string }[] = [];
  const db = {
    grade: {
      findUnique: jest.fn(async ({ select }) => {
        const where = select.studentGrades.where;
        expect(where).toMatchObject({ excused: false, score: { not: null } });
        const rows = opts.rows.filter((r) => !r.excused && r.score !== null && (!where.studentId || where.studentId.in.includes(r.studentId)));
        return {
          title: 'Prueba 1',
          published: opts.published ?? true,
          course: {
            name: 'Matemáticas',
            teacher: { userId: opts.courseTeacher ?? 'u-teacher' },
            studyPlan: { gradeMetric: opts.pass === null ? null : { minimumApproval: d(opts.pass ?? 3) } },
          },
          studentGrades: rows.map((r) => ({
            studentId: r.studentId,
            score: r.score === null ? null : d(r.score),
            student: {
              firstName: r.first,
              fatherName: 'E2E',
              classGroup: r.group ? { name: r.group.name, teacher: r.group.homeroom ? { userId: r.group.homeroom } : null } : null,
            },
          })),
        };
      }),
    },
    notification: {
      findMany: jest.fn(async ({ where }) =>
        (opts.sent ?? []).filter((k) => where.relatedId.in.includes(k)).map((relatedId) => ({ relatedId })),
      ),
      createMany: jest.fn(async ({ data }) => {
        created.push(...data);
        return { count: data.length };
      }),
    },
  };
  return { db, created };
}

const G7A = { name: '7°A', homeroom: 'u-homeroom' };

describe('alertHomeroomTeachers', () => {
  it('alerts the homeroom teacher of each student below the pass mark @FR-ASM-001.14', async () => {
    const { db, created } = setup({
      rows: [
        { studentId: 'S-ana', score: 4, first: 'Ana', group: G7A },
        { studentId: 'S-beto', score: 2, first: 'Beto', group: G7A },
        { studentId: 'S-carla', score: 3, first: 'Carla', group: G7A }, // at the pass mark: no alert
        { studentId: 'S-dani', score: null, excused: true, first: 'Dani', group: G7A },
      ],
    });
    await expect(alertHomeroomTeachers(db as never, 'G1', { actorUserId: 'u-teacher' })).resolves.toBe(1);
    expect(created).toEqual([
      {
        recipientId: 'u-homeroom',
        type: LOW_GRADE_ALERT,
        title: 'Nota bajo la nota mínima',
        message: 'Beto E2E (7°A) obtuvo 2.0 en «Prueba 1» de Matemáticas. Nota mínima: 3.0.',
        relatedId: 'G1:S-beto',
      },
    ]);
  });

  it('sends it once per student and grade @BR-ASM-001.12', async () => {
    const { db, created } = setup({ rows: [{ studentId: 'S-beto', score: 1, first: 'Beto', group: G7A }], sent: ['G1:S-beto'] });
    await expect(alertHomeroomTeachers(db as never, 'G1')).resolves.toBe(0);
    expect(created).toEqual([]);
  });

  it('skips the grading teacher, students without a homeroom teacher, drafts and plans without a scale', async () => {
    const own = setup({ rows: [{ studentId: 'S-beto', score: 1, first: 'Beto', group: { name: '7°A', homeroom: 'u-teacher' } }] });
    expect(await alertHomeroomTeachers(own.db as never, 'G1')).toBe(0);

    const actor = setup({ rows: [{ studentId: 'S-beto', score: 1, first: 'Beto', group: { name: '7°A', homeroom: 'u-admin' } }] });
    expect(await alertHomeroomTeachers(actor.db as never, 'G1', { actorUserId: 'u-admin' })).toBe(0);

    const none = setup({ rows: [{ studentId: 'S-beto', score: 1, first: 'Beto', group: { name: '7°A', homeroom: null } }] });
    expect(await alertHomeroomTeachers(none.db as never, 'G1')).toBe(0);

    const draft = setup({ published: false, rows: [{ studentId: 'S-beto', score: 1, first: 'Beto', group: G7A }] });
    expect(await alertHomeroomTeachers(draft.db as never, 'G1')).toBe(0);

    const noScale = setup({ pass: null, rows: [{ studentId: 'S-beto', score: 1, first: 'Beto', group: G7A }] });
    expect(await alertHomeroomTeachers(noScale.db as never, 'G1')).toBe(0);
  });

  it('limits itself to the given students', async () => {
    const { db, created } = setup({
      rows: [
        { studentId: 'S-ana', score: 1, first: 'Ana', group: G7A },
        { studentId: 'S-beto', score: 1, first: 'Beto', group: G7A },
      ],
    });
    await alertHomeroomTeachers(db as never, 'G1', { studentIds: ['S-beto'] });
    expect(created.map((n) => n.relatedId)).toEqual(['G1:S-beto']);
  });
});
