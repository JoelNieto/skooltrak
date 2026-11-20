jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { GradeBucketsService } from './grade-buckets.service';

describe('GradeBucketsService', () => {
  it("lists one course's buckets", async () => {
    const findMany = jest.fn().mockResolvedValue([{ id: 'B1' }]);
    const service = new GradeBucketsService({ gradeBucket: { findMany } } as never);
    await expect(service.findManyByCourseId('C1')).resolves.toEqual([{ id: 'B1' }]);
    expect(findMany).toHaveBeenCalledWith({ where: { courseId: 'C1' } });
  });
});
