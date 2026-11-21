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
