import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { Prisma } from '@generated/prisma';
import { GradeAccessService, NOT_ENROLLED, WRITE_DENIED } from '../grades/grade-access.service';
import {
  CELL_REPEATED,
  CELLS_CONFLICT,
  CELLS_INVALID,
  COLUMN_INVALID,
  COLUMN_PUBLISHED,
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

type Row = { id: string; gradeId: string; studentId: string; score: Prisma.Decimal | null; updatedAt: Date };

function setup() {
  // Ana has a row in G-draft; Beto has none yet.
  let rows: Row[] = [{ id: 'sg-ana', gradeId: 'G-draft', studentId: 'S-ana', score: d(3), updatedAt: T0 }];
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
      findMany: jest.fn(async ({ where }) => grades.filter((g) => where.id.in.includes(g.id))),
    },
    student: {
      findMany: jest.fn(async ({ where }) => {
        expect(where.courseEnrollments.some).toMatchObject({ courseId: 'C1', excluded: false });
        return roster.filter((id) => where.id.in.includes(id)).map((id) => ({ id }));
      }),
    },
    studentGrade: {
      findMany: jest.fn(async ({ where }) =>
        rows.filter((r) => where.gradeId.in.includes(r.gradeId) && where.studentId.in.includes(r.studentId)).map(select),
      ),
      createMany: jest.fn(async ({ data }) => {
        for (const row of data) rows.push({ id: `sg-new-${++seq}`, ...row, score: row.score === null ? null : d(row.score), updatedAt: now() });
        return { count: data.length };
      }),
    },
    $queryRaw: jest.fn(async () => []),
    // The bulk UPDATE: its VALUES list arrives as one joined Sql of (id, score) pairs.
    $executeRaw: jest.fn(async (_strings: TemplateStringsArray, values: Prisma.Sql) => {
      const flat = values.values as (string | number | null)[];
      for (let i = 0; i < flat.length; i += 2) {
        const row = rows.find((r) => r.id === flat[i]);
        if (row) {
          row.score = flat[i + 1] === null ? null : d(flat[i + 1] as number);
          row.updatedAt = now();
        }
      }
      return flat.length / 2;
    }),
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
      const snapshot = rows.map((r) => ({ ...r }));
      try {
        return await fn(prisma);
      } catch (error) {
        rows = snapshot;
        throw error;
      }
    }),
  };
  const service = new GradebookService(prisma as never, new GradeAccessService(prisma as never), { now: () => T0 });
  return { prisma, service, rows: () => rows };
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
    expect(rows().map((r) => [r.studentId, r.score?.toNumber() ?? null])).toEqual([
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
          cell('G-pub', 'S-ana', 3, null),
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
        { gradeId: 'G-pub', studentId: 'S-ana', reason: COLUMN_PUBLISHED },
        { gradeId: 'G-t2', studentId: 'S-ana', reason: COLUMN_INVALID },
        { gradeId: 'G-other', studentId: 'S-ana', reason: COLUMN_INVALID },
        { gradeId: 'G-draft', studentId: 'S-ana', reason: CELL_REPEATED },
      ],
    });
    expect(rows()[0].score?.toNumber()).toBe(3);
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
      cells: [{ gradeId: 'G-draft', studentId: 'S-ana', studentGradeId: 'sg-ana', score: 3, updatedAt: T0.toISOString() }],
    });
    expect(rows()).toHaveLength(1);
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
