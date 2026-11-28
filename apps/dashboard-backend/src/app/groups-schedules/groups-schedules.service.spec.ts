import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GroupsSchedulesService, INVALID_RANGE } from './groups-schedules.service';

describe('GroupsSchedulesService', () => {
  let service: GroupsSchedulesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupsSchedulesService],
    })
      .useMocker(() => ({}))
      .compile();

    service = await module.resolve(GroupsSchedulesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

describe('GroupsSchedulesService.assertNoClash', () => {
  type Row = {
    id: string;
    classGroupId: string;
    teacherId: string | null;
    weekday: string;
    startTime: string;
    endTime: string;
    recess?: boolean;
  };
  const rows: Row[] = [
    { id: 'A', classGroupId: 'G1', teacherId: 'T1', weekday: 'THURSDAY', startTime: '12:30', endTime: '13:15' },
    { id: 'B', classGroupId: 'G2', teacherId: 'T2', weekday: 'MONDAY', startTime: '07:00', endTime: '07:45' },
    {
      id: 'R',
      classGroupId: 'G1',
      teacherId: null,
      weekday: 'MONDAY',
      startTime: '09:15',
      endTime: '09:35',
      recess: true,
    },
  ];
  const view = (r: Row) => ({
    ...r,
    classGroup: { name: r.classGroupId === 'G1' ? '7°A' : '7°B' },
    course: { name: 'Arte', subject: { name: 'Expresiones Artísticas' } },
  });
  const prisma = {
    classGroupWeeklySchedule: {
      findMany: async ({ where }: { where: Record<string, unknown> }) =>
        rows
          .filter((r) => r.weekday === where['weekday'] && !r.recess)
          .filter((r) =>
            typeof where['classGroupId'] === 'string'
              ? r.classGroupId === where['classGroupId']
              : r.classGroupId !== (where['classGroupId'] as { not: string }).not,
          )
          .filter((r) => {
            const course = where['course'] as { teacherId: string } | undefined;
            return !course || r.teacherId === course.teacherId;
          })
          .map(view),
    },
    course: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        where.id === 'C2'
          ? { teacherId: 'T2', teacher: { user: { firstName: 'Ana', lastName: 'Castillo' } } }
          : { teacherId: 'T9', teacher: null },
    },
  };
  const svc = new GroupsSchedulesService(prisma as never);
  const base = { classGroupId: 'G1', courseId: 'C1', weekday: 'THURSDAY' as const };

  it('refuses a class that overlaps another class of the group', async () => {
    await expect(svc.assertNoClash({ ...base, startTime: '12:40', endTime: '13:25' })).rejects.toThrow(
      new ConflictException('7°A ya tiene Expresiones Artísticas el jueves de 12:30 a 13:15'),
    );
  });

  it('lets a slot keep its own time and touch neighbours', async () => {
    await expect(
      svc.assertNoClash({ ...base, id: 'A', startTime: '12:30', endTime: '13:15' }),
    ).resolves.toBeUndefined();
    await expect(svc.assertNoClash({ ...base, startTime: '13:15', endTime: '14:00' })).resolves.toBeUndefined();
  });

  it('refuses a class whose teacher is with another group at that time', async () => {
    await expect(
      svc.assertNoClash({ ...base, courseId: 'C2', weekday: 'MONDAY', startTime: '07:30', endTime: '08:15' }),
    ).rejects.toThrow(new ConflictException('Ana Castillo ya tiene clase con 7°B el lunes de 07:00 a 07:45'));
  });

  it('ignores recess slots and rejects invalid ranges', async () => {
    await expect(
      svc.assertNoClash({ ...base, weekday: 'MONDAY', startTime: '09:00', endTime: '09:30' }),
    ).resolves.toBeUndefined();
    await expect(svc.assertNoClash({ ...base, startTime: '10:00', endTime: '09:00' })).rejects.toThrow(
      new BadRequestException(INVALID_RANGE),
    );
  });
});
