import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { Prisma } from '@generated/prisma';
import { GradeAccessService, NOT_ENROLLED, WRITE_DENIED } from '../grades/grade-access.service';
import { COMMENT_TOO_LONG, REASON_REQUIRED } from '../grades/grade-revisions';
import {
  CELL_REPEATED,
  EXCUSED_WITH_SCORE,
  CELLS_CONFLICT,
  CELLS_INVALID,
  COLUMN_INVALID,
  GradebookService,
  METRIC_MISSING,
} from './gradebook.service';

/**
 * ASM-001-S03 — saving gradebook cells (FR-ASM-001.6, BR .2, .7, .10). Runs the real service and
 * GradeAccessService against an in-memory stand-in for the Prisma calls they make.
 */

// C1 (scale 1–5) is taught by teacher-1; C2 (no scale) by teacher-1 too. In C1, period T1:
// G-draft (draft) and G-pub (published); G-t2 is a draft of period T2; G-other belongs to C2.
// Roster of C1: S-ana, S-beto. S-out is not on it.
const d = (n: number) => new Prisma.Decimal(n);
const courses = [
  { id: 'C1', organizationId: 'org-1', studyPlanId: 'P1', teacherId: 'teacher-1', metric: true },
  { id: 'C2', organizationId: 'org-1', studyPlanId: 'P2', teacherId: 'teacher-1', metric: false },
];
const teachers = [
  { id: 'teacher-1', userId: 'u-teacher', organizationId: 'org-1' },
  { id: 'teacher-2', userId: 'u-teacher2', organizationId: 'org-1' },
];
const grades = [
  { id: 'G-draft', courseId: 'C1', periodId: 'T1', published: false },
  { id: 'G-pub', courseId: 'C1', periodId: 'T1', published: true },
  { id: 'G-t2', courseId: 'C1', periodId: 'T2', published: false },
  { id: 'G-other', courseId: 'C2', periodId: 'T1', published: false },
];
const roster = ['S-ana', 'S-beto'];
const T0 = new Date('2026-11-20T10:00:00.000Z');

type Row = {
  id: string;
  gradeId: string;
  studentId: string;
  score: Prisma.Decimal | null;
  excused: boolean;
  comments: string | null;
  updatedAt: Date;
};
type Revision = {
  studentGradeId: string;
  previousScore: number | null;
  score: number | null;
  excused: boolean;
  reason: string;
  changedById: string | null;
};

function setup() {
  // Ana has a row in G-draft and 4 in the published G-pub; Beto has none yet.
  let rows: Row[] = [
    { id: 'sg-ana', gradeId: 'G-draft', studentId: 'S-ana', score: d(3), excused: false, comments: null, updatedAt: T0 },
    { id: 'sg-ana-pub', gradeId: 'G-pub', studentId: 'S-ana', score: d(4), excused: false, comments: null, updatedAt: T0 },
  ];
  let revisions: Revision[] = [];
  const published: string[] = [];
  const notified: string[] = [];
  let seq = 0;
  const now = () => new Date(T0.getTime() + 60_000 * ++seq);
  const select = (r: Row) => ({ ...r });
  const prisma = {
    teacher: {
      findFirst: jest.fn(async ({ where }) =>
        teachers.find((t) => t.userId === where.userId && t.organizationId === where.organizationId) ?? null,
      ),
    },
    course: {
      findUnique: jest.fn(async ({ where }) => {
        const c = courses.find((x) => x.id === where.id);
        return c ? { id: c.id, organizationId: c.organizationId, studyPlanId: c.studyPlanId, teacherId: c.teacherId } : null;
      }),
      findUniqueOrThrow: jest.fn(async ({ where }) => {
        const c = courses.find((x) => x.id === where.id);
        if (!c) throw new Error(`course ${where.id}`);
        return {
          organizationId: c.organizationId,
          studyPlan: { gradeMetric: c.metric ? { minimum: d(1), maximum: d(5) } : null },
        };
      }),
    },
    grade: {
      findMany: jest.fn(async ({ where }) =>
        grades.filter((g) => where.id.in.includes(g.id)).map((g) => ({ ...g, published: g.published || published.includes(g.id) })),
      ),
      updateMany: jest.fn(async ({ where, data }) => {
        expect(data).toMatchObject({ published: true, publishedById: 'u-teacher' });
        expect(data.publishedAt).toBeInstanceOf(Date);
        published.push(...where.id.in);
        return { count: where.id.in.length };
      }),
    },
    studentGradeRevision: {
      findMany: jest.fn(async ({ where }) =>
        where.studentGradeId === 'sg-ana-pub'
          ? [
              {
                id: 'rev-1',
                previousScore: d(3),
                score: d(4),
                excused: false,
                reason: 'Error de transcripción',
                createdAt: T0,
                changedBy: { id: 'u-teacher', firstName: 'Tomás', lastName: 'Docente' },
              },
            ]
          : [],
      ),
      createMany: jest.fn(async ({ data }) => {
        revisions.push(...data);
        return { count: data.length };
      }),
    },
    student: {
      findMany: jest.fn(async ({ where }) => {
        expect(where.courseEnrollments.some).toMatchObject({ courseId: 'C1', excluded: false });
        return roster.filter((id) => where.id.in.includes(id)).map((id) => ({ id }));
      }),
    },
    studentGrade: {
      findUnique: jest.fn(async ({ where }) => {
        const row = rows.find((r) => r.id === where.id);
        const grade = grades.find((g) => g.id === row?.gradeId);
        return row && grade ? { id: row.id, studentId: row.studentId, gradeId: row.gradeId, grade: { courseId: grade.courseId, published: grade.published } } : null;
      }),
      findMany: jest.fn(async ({ where }) =>
        rows.filter((r) => where.gradeId.in.includes(r.gradeId) && where.studentId.in.includes(r.studentId)).map(select),
      ),
      createMany: jest.fn(async ({ data }) => {
        for (const row of data) {
          rows.push({
            id: `sg-new-${++seq}`,
            comments: null,
            excused: false,
            ...row,
            score: row.score === null ? null : d(row.score),
            updatedAt: now(),
          });
        }
        return { count: data.length };
      }),
    },
    $queryRaw: jest.fn(async () => []),
    // The bulk UPDATE: its VALUES list arrives as one joined Sql of (id, score, excused, setComment, comment).
    $executeRaw: jest.fn(async (_strings: TemplateStringsArray, values: Prisma.Sql) => {
      const flat = values.values as (string | number | boolean | null)[];
      for (let i = 0; i < flat.length; i += 5) {
        const row = rows.find((r) => r.id === flat[i]);
        if (row) {
          row.score = flat[i + 1] === null ? null : d(flat[i + 1] as number);
          row.excused = flat[i + 2] as boolean;
          if (flat[i + 3]) row.comments = flat[i + 4] as string | null;
          row.updatedAt = now();
        }
      }
      return flat.length / 5;
    }),
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
      const snapshot = rows.map((r) => ({ ...r }));
      const revisionSnapshot = [...revisions];
      try {
        return await fn(prisma);
      } catch (error) {
        rows = snapshot;
        revisions = revisionSnapshot;
        throw error;
      }
    }),
  };
  const grades$ = { notifyPublished: jest.fn(async (id: string) => void notified.push(id)) };
  const service = new GradebookService(
    prisma as never,
    new GradeAccessService(prisma as never),
    { now: () => T0 },
    grades$ as never,
  );
  return { prisma, service, rows: () => rows, revisions: () => revisions, published, notified };
}

const teacher = { userId: 'u-teacher', organizationId: 'org-1', role: 'TEACHER' } as never;
const teacher2 = { userId: 'u-teacher2', organizationId: 'org-1', role: 'TEACHER' } as never;
const otherAdmin = { userId: 'u-admin9', organizationId: 'org-2', role: 'ORG_ADMIN' } as never;

const cell = (gradeId: string, studentId: string, score: number | null, updatedAt: string | null) => ({
  gradeId,
  studentId,
  score,
  updatedAt,
});

async function refusal(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return error as BadRequestException | ConflictException;
  }
  throw new Error('expected the save to be refused');
}

describe('GradebookService.saveCells (ASM-001-S03)', () => {
  it('updates loaded rows and creates missing ones in one save @FR-ASM-001.6 @BR-ASM-001.10', async () => {
    const { service, rows } = setup();
    const { cells } = await service.saveCells(teacher, 'C1', {
      periodId: 'T1',
      cells: [cell('G-draft', 'S-ana', 4.5, T0.toISOString()), cell('G-draft', 'S-beto', 2, null)],
    });
    expect(cells.map((c) => [c.studentId, c.score, c.studentGradeId !== null])).toEqual([
      ['S-ana', 4.5, true],
      ['S-beto', 2, true],
    ]);
    expect(cells[0].updatedAt).not.toBe(T0.toISOString());
    const draftRows = rows().filter((r) => r.gradeId === 'G-draft');
    expect(draftRows.map((r) => [r.studentId, r.score?.toNumber() ?? null])).toEqual([
      ['S-ana', 4.5],
      ['S-beto', 2],
    ]);
  });

  it('empties a cell with a null score', async () => {
    const { service, rows } = setup();
    await service.saveCells(teacher, 'C1', { periodId: 'T1', cells: [cell('G-draft', 'S-ana', null, T0.toISOString())] });
    expect(rows()[0].score).toBeNull();
  });

  it('refuses the whole save, listing every invalid cell @BR-ASM-001.2', async () => {
    const { service, rows } = setup();
    const error = await refusal(
      service.saveCells(teacher, 'C1', {
        periodId: 'T1',
        cells: [
          cell('G-draft', 'S-ana', 4, T0.toISOString()),
          cell('G-draft', 'S-beto', 7, null),
          cell('G-draft', 'S-out', 3, null),
          cell('G-t2', 'S-ana', 3, null),
          cell('G-other', 'S-ana', 3, null),
          cell('G-draft', 'S-ana', 4.25, T0.toISOString()),
        ],
      }),
    );
    expect(error).toBeInstanceOf(BadRequestException);
    expect(error.getResponse()).toEqual({
      message: CELLS_INVALID,
      cells: [
        { gradeId: 'G-draft', studentId: 'S-beto', reason: 'Entre 1 y 5' },
        { gradeId: 'G-draft', studentId: 'S-out', reason: NOT_ENROLLED },
        { gradeId: 'G-t2', studentId: 'S-ana', reason: COLUMN_INVALID },
        { gradeId: 'G-other', studentId: 'S-ana', reason: COLUMN_INVALID },
        { gradeId: 'G-draft', studentId: 'S-ana', reason: CELL_REPEATED },
      ],
    });
    expect(rows()[0].score?.toNumber()).toBe(3);
  });

  it('refuses a comment over 500 characters @BR-ASM-001.14', async () => {
    const { service } = setup();
    const error = await refusal(
      service.saveCells(teacher, 'C1', {
        periodId: 'T1',
        cells: [{ ...cell('G-draft', 'S-ana', 3, T0.toISOString()), comment: 'x'.repeat(501) }],
      }),
    );
    expect(error.getResponse()).toMatchObject({ cells: [{ reason: COMMENT_TOO_LONG }] });
  });

  it('refuses one decimal too many', async () => {
    const { service } = setup();
    const error = await refusal(
      service.saveCells(teacher, 'C1', { periodId: 'T1', cells: [cell('G-draft', 'S-beto', 4.25, null)] }),
    );
    expect(error.getResponse()).toMatchObject({ cells: [{ reason: 'Máximo un decimal' }] });
  });

  it('refuses a save without a grade scale', async () => {
    const { service } = setup();
    const error = await refusal(
      service.saveCells(teacher, 'C2', { periodId: 'T1', cells: [cell('G-other', 'S-ana', 3, null)] }),
    );
    expect(error.getResponse()).toEqual({ message: METRIC_MISSING, cells: [] });
  });

  it('refuses the whole save when a row changed since it was loaded @BR-ASM-001.7', async () => {
    const { service, rows } = setup();
    const stale = new Date(T0.getTime() - 1000).toISOString();
    const error = await refusal(
      service.saveCells(teacher, 'C1', {
        periodId: 'T1',
        cells: [cell('G-draft', 'S-beto', 2, null), cell('G-draft', 'S-ana', 5, stale)],
      }),
    );
    expect(error).toBeInstanceOf(ConflictException);
    expect(error.getResponse()).toEqual({
      message: CELLS_CONFLICT,
      cells: [
        { gradeId: 'G-draft', studentId: 'S-ana', studentGradeId: 'sg-ana', score: 3, excused: false, comment: null, updatedAt: T0.toISOString() },
      ],
    });
    expect(rows()).toHaveLength(2);
  });

  it('treats a row created since loading as a conflict @BR-ASM-001.7', async () => {
    const { service } = setup();
    const error = await refusal(
      service.saveCells(teacher, 'C1', { periodId: 'T1', cells: [cell('G-draft', 'S-ana', 5, null)] }),
    );
    expect(error).toBeInstanceOf(ConflictException);
  });

  it("refuses another teacher's course and another organization's @BR-ASM-001.1", async () => {
    const { service } = setup();
    const input = { periodId: 'T1', cells: [cell('G-draft', 'S-beto', 2, null)] };
    await expect(service.saveCells(teacher2, 'C1', input)).rejects.toThrow(new ForbiddenException(WRITE_DENIED));
    await expect(service.saveCells(otherAdmin, 'C1', input)).rejects.toThrow(new ForbiddenException(WRITE_DENIED));
  });
});

describe('GradebookService.saveCells, published columns (ASM-001-S04)', () => {
  const pub = (score: number | null, extra: object = {}) => ({ ...cell('G-pub', 'S-ana', score, T0.toISOString()), ...extra });

  it('refuses a changed published score without a valid reason @BR-ASM-001.8', async () => {
    const { service, rows, revisions } = setup();
    for (const reason of [undefined, '  ', 'ab', 'x'.repeat(301)]) {
      const error = await refusal(service.saveCells(teacher, 'C1', { periodId: 'T1', reason, cells: [pub(3)] }));
      expect(error.getResponse()).toEqual({
        message: REASON_REQUIRED,
        cells: [{ gradeId: 'G-pub', studentId: 'S-ana', reason: REASON_REQUIRED }],
      });
    }
    expect(rows()[1].score?.toNumber()).toBe(4);
    expect(revisions()).toEqual([]);
  });

  it('writes one revision per changed published score: previous, new, author, reason @FR-ASM-001.9', async () => {
    const { service, rows, revisions } = setup();
    await service.saveCells(teacher, 'C1', {
      periodId: 'T1',
      reason: 'Error de transcripción',
      cells: [pub(3), cell('G-draft', 'S-ana', 5, T0.toISOString()), cell('G-pub', 'S-beto', 2, null)],
    });
    expect(rows().find((r) => r.id === 'sg-ana-pub')?.score?.toNumber()).toBe(3);
    const betoRow = rows().find((r) => r.gradeId === 'G-pub' && r.studentId === 'S-beto');
    // The draft cell writes none (BR .8); a first score on a published column does.
    expect(revisions()).toEqual([
      { studentGradeId: 'sg-ana-pub', previousScore: 4, score: 3, excused: false, reason: 'Error de transcripción', changedById: 'u-teacher' },
      { studentGradeId: betoRow?.id, previousScore: null, score: 2, excused: false, reason: 'Error de transcripción', changedById: 'u-teacher' },
    ]);
  });

  it("uses a cell's own reason over the save's", async () => {
    const { service, revisions } = setup();
    await service.saveCells(teacher, 'C1', { periodId: 'T1', reason: 'General', cells: [pub(3.5, { reason: ' Revisión ' })] });
    expect(revisions()[0].reason).toBe('Revisión');
  });

  it('saves a comment-only change without a reason or a revision @BR-ASM-001.14', async () => {
    const { service, rows, revisions } = setup();
    const { cells } = await service.saveCells(teacher, 'C1', { periodId: 'T1', cells: [pub(4, { comment: 'Buen trabajo' })] });
    expect(cells[0].comment).toBe('Buen trabajo');
    expect(rows()[1].comments).toBe('Buen trabajo');
    expect(revisions()).toEqual([]);
  });
});

describe('GradebookService.publish (ASM-001-S04)', () => {
  it('publishes the drafts, stamps them and notifies @FR-ASM-001.7 @BR-ASM-001.9', async () => {
    const { service, published, notified } = setup();
    await expect(service.publish(teacher, 'C1', ['G-draft', 'G-pub', 'G-draft'])).resolves.toEqual({ gradeIds: ['G-draft'] });
    expect(published).toEqual(['G-draft']);
    await new Promise((resolve) => setImmediate(resolve)); // notifications go out after the response
    expect(notified).toEqual(['G-draft']);
  });

  it("refuses another course's column and another teacher's course", async () => {
    const { service, notified } = setup();
    await expect(service.publish(teacher, 'C1', ['G-other'])).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.publish(teacher2, 'C1', ['G-draft'])).rejects.toThrow(new ForbiddenException(WRITE_DENIED));
    expect(notified).toEqual([]);
  });
});

describe('GradebookService.history (ASM-001-S04)', () => {
  it("lists a cell's revisions with their author @FR-ASM-001.8", async () => {
    const { service } = setup();
    await expect(service.history(teacher, 'sg-ana-pub')).resolves.toEqual({
      revisions: [
        {
          id: 'rev-1',
          previousScore: 3,
          score: 4,
          excused: false,
          reason: 'Error de transcripción',
          changedBy: { id: 'u-teacher', name: 'Tomás Docente' },
          createdAt: T0.toISOString(),
        },
      ],
    });
  });

  it("refuses another teacher's course @BR-ASM-001.1", async () => {
    const { service } = setup();
    await expect(service.history(teacher2, 'sg-ana-pub')).rejects.toThrow(new ForbiddenException(WRITE_DENIED));
  });
});

describe('GradebookService.saveCells, excused cells (ASM-001-S05)', () => {
  it('excuses a draft cell: no score, no revision @BR-ASM-001.3', async () => {
    const { service, rows, revisions } = setup();
    const { cells } = await service.saveCells(teacher, 'C1', {
      periodId: 'T1',
      cells: [{ ...cell('G-draft', 'S-ana', null, T0.toISOString()), excused: true }, { ...cell('G-draft', 'S-beto', null, null), excused: true }],
    });
    expect(cells.map((c) => [c.studentId, c.score, c.excused])).toEqual([
      ['S-ana', null, true],
      ['S-beto', null, true],
    ]);
    expect(rows().filter((r) => r.gradeId === 'G-draft').every((r) => r.excused && r.score === null)).toBe(true);
    expect(revisions()).toEqual([]);
  });

  it('refuses a cell that is both excused and scored', async () => {
    const { service } = setup();
    const error = await refusal(
      service.saveCells(teacher, 'C1', { periodId: 'T1', cells: [{ ...cell('G-draft', 'S-beto', 4, null), excused: true }] }),
    );
    expect(error.getResponse()).toMatchObject({ cells: [{ reason: EXCUSED_WITH_SCORE }] });
  });

  it('needs a reason to excuse a published cell, and records it @BR-ASM-001.8', async () => {
    const { service, revisions } = setup();
    const excuse = { ...cell('G-pub', 'S-ana', null, T0.toISOString()), excused: true };
    const error = await refusal(service.saveCells(teacher, 'C1', { periodId: 'T1', cells: [excuse] }));
    expect(error.getResponse()).toMatchObject({ message: REASON_REQUIRED });

    await service.saveCells(teacher, 'C1', { periodId: 'T1', reason: 'Certificado médico', cells: [excuse] });
    expect(revisions()).toEqual([
      { studentGradeId: 'sg-ana-pub', previousScore: 4, score: null, excused: true, reason: 'Certificado médico', changedById: 'u-teacher' },
    ]);
  });
});
