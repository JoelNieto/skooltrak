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

  it('weights scores by bucket and skips empty scores', async () => {
    const findMany = jest.fn().mockResolvedValue([
      { score: decimal(4), grade: { bucket: { weight: decimal(40) } } },
      { score: decimal(2), grade: { bucket: { weight: decimal(60) } } },
      { score: null, grade: { bucket: { weight: decimal(60) } } },
    ]);
    const service = new StudentGradesService({ studentGrade: { findMany } } as never);
    await expect(service.getAverageScoreForStudent('C1', 'P1', 'S1')).resolves.toBeCloseTo(2.8);
  });
});
