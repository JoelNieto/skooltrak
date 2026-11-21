jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { StudentGradesService } from './student-grades.service';

const decimal = (n: number) => ({ toNumber: () => n });

describe('StudentGradesService', () => {
  it('reads only published grades of the course', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const service = new StudentGradesService({ studentGrade: { findMany } } as never);
    await service.findByCourseId('C1', 'P1', 'S1');
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { grade: { courseId: 'C1', periodId: 'P1', published: true }, studentId: 'S1' } }),
    );
  });

  it("weights each bucket's mean and skips empty scores (ASM-001 BR .4)", async () => {
    const cell = (score: number | null, bucketId: string, weight: number) => ({
      score: score === null ? null : decimal(score),
      grade: { bucketId, bucket: { weight: decimal(weight) } },
    });
    const findMany = jest.fn().mockResolvedValue([
      cell(4, 'daily', 40),
      cell(4, 'daily', 40),
      cell(4, 'daily', 40),
      cell(4, 'daily', 40),
      cell(2, 'tests', 60),
      cell(null, 'tests', 60),
    ]);
    const service = new StudentGradesService({ studentGrade: { findMany } } as never);
    await expect(service.getAverageScoreForStudent('C1', 'P1', 'S1')).resolves.toBeCloseTo(2.8);
  });

  it('has no average without a scored grade, not 0', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const service = new StudentGradesService({ studentGrade: { findMany } } as never);
    await expect(service.getAverageScoreForStudent('C1', 'P1', 'S1')).resolves.toBeNull();
  });
});

/** ASM-001-S04: the grade page's score dialog follows BR .8 too. */
describe('StudentGradesService writes on published grades', () => {
  function build(score: number | null) {
    const revisions: unknown[] = [];
    const tx = {
      studentGrade: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({ score: score === null ? null : decimal(score) }),
        findUnique: jest.fn().mockResolvedValue(score === null ? null : { score: decimal(score) }),
        update: jest.fn().mockResolvedValue({ id: 'SG1' }),
        upsert: jest.fn().mockResolvedValue({ id: 'SG1' }),
      },
      studentGradeRevision: { createMany: jest.fn(async ({ data }) => revisions.push(...data)) },
    };
    const prisma = { $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)) };
    return { service: new StudentGradesService(prisma as never), tx, revisions };
  }

  it('refuses a changed published score without a reason (BR-ASM-001.8)', async () => {
    const { service, tx } = build(2);
    await expect(service.update('SG1', { id: 'SG1', score: 3 }, true, 'u-teacher')).rejects.toThrow('Indica el motivo del cambio');
    expect(tx.studentGrade.update).not.toHaveBeenCalled();
  });

  it('writes a revision with the previous and new score', async () => {
    const { service, revisions } = build(2);
    await service.update('SG1', { id: 'SG1', score: 3, reason: 'Recalificada' }, true, 'u-teacher');
    expect(revisions).toEqual([{ studentGradeId: 'SG1', previousScore: 2, score: 3, reason: 'Recalificada', changedById: 'u-teacher' }]);
  });

  it('needs no reason for a draft, an unchanged score or a comment', async () => {
    for (const [input, published] of [
      [{ id: 'SG1', score: 3 }, false],
      [{ id: 'SG1', score: 2 }, true],
      [{ id: 'SG1', comments: 'Bien' }, true],
    ] as const) {
      const { service, revisions } = build(2);
      await service.update('SG1', input, published, 'u-teacher');
      expect(revisions).toEqual([]);
    }
  });

  it('asks for a reason when a first score is added to a published grade', async () => {
    const { service, revisions } = build(null);
    const input = { gradeId: 'GR1', studentId: 'S1', score: 4 };
    await expect(service.create(input, true, 'u-teacher')).rejects.toThrow('Indica el motivo del cambio');
    await service.create({ ...input, reason: 'Entregó tarde' }, true, 'u-teacher');
    expect(revisions).toEqual([{ studentGradeId: 'SG1', previousScore: null, score: 4, reason: 'Entregó tarde', changedById: 'u-teacher' }]);
  });
});
