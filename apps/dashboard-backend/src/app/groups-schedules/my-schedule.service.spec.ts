import { ForbiddenException } from '@nestjs/common';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));
import { NOT_LINKED } from '../courses/courses-mine.service';
import { MyScheduleService, NO_SCHEDULE_PROFILE } from './my-schedule.service';

describe('MyScheduleService', () => {
  const students = [
    {
      id: 'S-ana',
      userId: 'u-ana',
      organizationId: 'org-1',
      parents: ['u-mom'],
      firstName: 'Ana',
      fatherName: 'Méndez',
      classGroup: { id: 'G1', name: '7°A' },
      school: { timezone: 'America/Panama' },
    },
  ];
  const teachers = [{ id: 'T1', userId: 'u-luis', organizationId: 'org-1', firstName: 'Luis', fatherName: 'Herrera' }];
  const row = (id: string, groupId: string, teacherId: string) => ({
    id,
    weekday: 'MONDAY',
    startTime: '07:00',
    endTime: '07:45',
    location: 'Aula 12',
    remote: false,
    remoteLink: '',
    recess: false,
    classGroupId: groupId,
    teacherId,
    classGroup: { id: groupId, name: groupId === 'G1' ? '7°A' : '7°B' },
    course: {
      id: 'C1',
      name: 'Matemática 7',
      shortName: 'MAT',
      code: 'MAT7',
      color: 'INDIGO',
      subject: { name: 'Matemática', code: 'MAT' },
      teacher: { user: { firstName: 'Luis', lastName: 'Herrera' } },
      school: { timezone: 'America/Panama' },
    },
  });
  const rows = [row('a', 'G1', 'T1'), row('b', 'G2', 'T1'), row('c', 'G2', 'T2')];

  type Where = Record<string, unknown>;
  const prisma = {
    student: {
      findFirst: async ({ where }: { where: Where }) =>
        students.find((s) =>
          where['userId']
            ? s.userId === where['userId'] && s.organizationId === where['organizationId']
            : s.id === where['id'] &&
              s.parents.includes((where['parents'] as { some: { userId: string } }).some.userId),
        ) ?? null,
    },
    teacher: {
      findFirst: async ({ where }: { where: Where }) =>
        teachers.find((t) => t.userId === where['userId'] && t.organizationId === where['organizationId']) ?? null,
    },
    classGroupWeeklySchedule: {
      findMany: async ({ where }: { where: Where }) =>
        rows.filter((r) =>
          where['classGroupId']
            ? r.classGroupId === where['classGroupId']
            : r.teacherId === (where['course'] as { teacherId: string }).teacherId,
        ),
    },
  };
  // Monday 2026-11-23 10:40 in Panama (UTC-5).
  const clock = { now: () => new Date('2026-11-23T15:40:00Z') };
  const service = new MyScheduleService(prisma as never, clock);
  const user = (userId: string, role: string) => ({ userId, role, organizationId: 'org-1' }) as never;

  it("gives a student their group's week and the school's local time", async () => {
    const mine = await service.mine(user('u-ana', 'STUDENT'), 'S-other');
    expect(mine.kind).toBe('STUDENT');
    expect(mine.name).toBe('Ana Méndez');
    expect(mine.group).toEqual({ id: 'G1', name: '7°A' });
    expect(mine.now).toEqual({ weekday: 'MONDAY', time: '10:40' });
    expect(mine.slots.map((s) => s.id)).toEqual(['a']);
    expect(mine.slots[0]).toMatchObject({ teacherName: 'Luis Herrera', group: { name: '7°A' } });
  });

  it("gives a parent a linked child's week and refuses another child", async () => {
    const mine = await service.mine(user('u-mom', 'PARENT'), 'S-ana');
    expect(mine.kind).toBe('STUDENT');
    expect(mine.slots.map((s) => s.id)).toEqual(['a']);
    await expect(service.mine(user('u-dad', 'PARENT'), 'S-ana')).rejects.toThrow(new ForbiddenException(NOT_LINKED));
  });

  it('gives a teacher their classes across groups', async () => {
    const mine = await service.mine(user('u-luis', 'TEACHER'));
    expect(mine.kind).toBe('TEACHER');
    expect(mine.name).toBe('Luis Herrera');
    expect(mine.slots.map((s) => `${s.id}:${s.group.name}`)).toEqual(['a:7°A', 'b:7°B']);
  });

  it('refuses someone with no student or teacher profile', async () => {
    await expect(service.mine(user('u-nobody', 'PARENT'))).rejects.toThrow(new ForbiddenException(NO_SCHEDULE_PROFILE));
  });
});
