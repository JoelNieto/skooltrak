import { BadRequestException, ForbiddenException } from '@nestjs/common';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { courseBand, CoursesMineService, NO_STUDENT, PERIOD_INVALID } from './courses-mine.service';

/** ACA-001-S02 — the student's *Mis cursos* (FR-ACA-001.4, .5; BR .1, .5, .9). */
const d = (n: number) => ({ toNumber: () => n });
const periods = [
  { id: 'T1', name: 'Trimestre 1', startDate: new Date('2026-03-01'), endDate: new Date('2026-05-31') },
  { id: 'T2', name: 'Trimestre 2', startDate: new Date('2026-06-01'), endDate: new Date('2026-08-31') },
];
// Ana (group 7°A) is enrolled in Matemáticas (scale 1–5, pass 3), Ciencias (no scale) and Arte.
const courses = [
  {
    id: 'C-mat',
    name: 'Matemáticas 7°',
    color: 'TEAL',
    subject: { name: 'Matemáticas', icon: 'calculator' },
    teacher: { firstName: 'Tomás', fatherName: 'Docente', user: { color: '#336' } },
    studyPlan: { gradeMetric: { maximum: d(5), minimumApproval: d(3) } },
  },
  {
    id: 'C-cie',
    name: 'Ciencias 7°',
    color: null,
    subject: { name: 'Ciencias', icon: null },
    teacher: null,
    studyPlan: { gradeMetric: null },
  },
  {
    id: 'C-art',
    name: 'Arte 7°',
    color: 'ROSE',
    subject: { name: 'Arte', icon: 'palette' },
    teacher: { firstName: 'Olga', fatherName: 'Docente', user: null },
    studyPlan: { gradeMetric: { maximum: d(5), minimumApproval: d(3) } },
  },
];
const slot = (courseId: string, weekday: string, location = 'Aula 7', recess = false) => ({
  courseId,
  weekday,
  startTime: '07:00',
  endTime: '07:45',
  location,
  remote: false,
  recess,
});
const grade = (courseId: string, periodId: string, bucketId: string, weight: number, score: number) => ({
  studentId: 'S-ana',
  score: d(score),
  grade: { courseId, periodId, bucketId, bucket: { weight: d(weight) } },
});

function setup(opts: { student?: object | null; now?: Date } = {}) {
  const student =
    opts.student === undefined
      ? {
          id: 'S-ana',
          organizationId: 'org-1',
          classGroup: { id: 'G7A', name: '7°A' },
          school: { currentYear: 2026, timezone: 'America/Panama' },
        }
      : opts.student;
  const prisma = {
    student: { findFirst: jest.fn(async () => student) },
    period: { findMany: jest.fn(async () => periods) },
    course: {
      findMany: jest.fn(async ({ where }) => {
        expect(where.organizationId).toBe('org-1');
        expect(where.enrollments.some).toMatchObject({ excluded: false, student: { id: 'S-ana' } });
        return courses;
      }),
    },
    classGroupWeeklySchedule: {
      findMany: jest.fn(async () => [
        ...['MONDAY', 'WEDNESDAY', 'FRIDAY'].map((w) => slot('C-mat', w)),
        slot('C-mat', 'TUESDAY', '', true),
        ...['TUESDAY', 'THURSDAY'].map((w) => slot('C-art', w, 'Taller')),
      ]),
    },
    studentGrade: {
      findMany: jest.fn(async ({ where }) => {
        expect(where.grade.published).toBe(true);
        return [
          grade('C-mat', 'T1', 'daily', 40, 4),
          grade('C-mat', 'T1', 'tests', 60, 2),
          grade('C-art', 'T1', 'tests', 100, 4.5),
          grade('C-mat', 'T2', 'tests', 100, 5),
        ].filter((g) => g.grade.periodId === where.grade.periodId);
      }),
    },
  };
  const service = new CoursesMineService(prisma as never, { now: () => opts.now ?? new Date('2026-04-15T15:00:00Z') });
  return { prisma, service };
}

const ana = { userId: 'u-ana', organizationId: 'org-1', role: 'STUDENT' } as never;

describe('CoursesMineService (ACA-001-S02)', () => {
  it("lists the student's courses by subject with schedule, teacher and color @FR-ACA-001.4", async () => {
    const { service } = setup();
    const mine = await service.mine(ana, {});
    expect(mine.courses.map((c) => [c.subject.name, c.schedule, c.teacher?.name ?? null, c.color])).toEqual([
      ['Arte', 'Mar, Jue · Taller', 'Olga Docente', 'ROSE'],
      ['Ciencias', null, null, expect.any(String)],
      ['Matemáticas', 'Lun, Mié, Vie · Aula 7', 'Tomás Docente', 'TEAL'],
    ]);
    expect(mine.courses[2].teacher).toEqual({ name: 'Tomás Docente', initials: 'TD', color: '#336' });
    expect(mine.classGroup).toEqual({ id: 'G7A', name: '7°A' });
  });

  it('shows the period average and band, or none @BR-ACA-001.5', async () => {
    const { service } = setup();
    const mine = await service.mine(ana, {});
    const byId = Object.fromEntries(mine.courses.map((c) => [c.id, c]));
    // Matemáticas: 4 × 40 + 2 × 60 = 2.8 (BR-ASM-001.4), below 3.
    expect(byId['C-mat'].average).toBeCloseTo(2.8, 10);
    expect(byId['C-mat'].band).toBe('EN_RIESGO');
    expect([byId['C-art'].average, byId['C-art'].band]).toEqual([4.5, 'AL_DIA']);
    expect([byId['C-cie'].average, byId['C-cie'].band, byId['C-cie'].scale]).toEqual([null, null, null]);
    expect(byId['C-mat'].scale).toEqual({ maximum: 5, minimumApproval: 3 });
  });

  it('defaults to the current period and reloads for another @FR-ACA-001.5', async () => {
    const { service } = setup();
    expect((await service.mine(ana, {})).periodId).toBe('T1');
    const t2 = await service.mine(ana, { periodId: 'T2' });
    expect(t2.periodId).toBe('T2');
    expect(t2.courses.find((c) => c.id === 'C-mat')?.average).toBe(5);
    expect(t2.courses.find((c) => c.id === 'C-art')?.average).toBeNull();
    await expect(service.mine(ana, { periodId: 'OLD' })).rejects.toThrow(new BadRequestException(PERIOD_INVALID));
  });

  it('has no schedule without a class group @BR-ACA-001.1', async () => {
    const { service, prisma } = setup({
      student: { id: 'S-ana', organizationId: 'org-1', classGroup: null, school: { currentYear: 2026, timezone: 'UTC' } },
    });
    const mine = await service.mine(ana, {});
    expect(mine.classGroup).toBeNull();
    expect(mine.courses.every((c) => c.schedule === null)).toBe(true);
    expect(prisma.classGroupWeeklySchedule.findMany).not.toHaveBeenCalled();
  });

  it('refuses a caller without a student record in the organization', async () => {
    const { service } = setup({ student: null });
    await expect(service.mine({ userId: 'u-t', organizationId: 'org-1', role: 'TEACHER' } as never, {})).rejects.toThrow(
      new ForbiddenException(NO_STUDENT),
    );
  });

  it('bands on the average as shown', () => {
    expect(courseBand(2.96, 3)).toBe('AL_DIA');
    expect(courseBand(2.94, 3)).toBe('EN_RIESGO');
    expect(courseBand(null, 3)).toBeNull();
    expect(courseBand(4, null)).toBeNull();
  });
});
