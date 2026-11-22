import { BadRequestException, ForbiddenException } from '@nestjs/common';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { courseBand, CoursesMineService, isDone, nextDelivery, NO_STUDENT, NOT_LINKED, PERIOD_INVALID } from './courses-mine.service';

/** ACA-001-S02, S03 — the student's *Mis cursos* (FR-ACA-001.4, .5, .6; BR .1, .5, .7, .8, .9, .10). */
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

// Work of group 7°A (now: Wed 2026-04-15, week Mon 13 – Sun 19). Matemáticas: one overdue, one handed
// in, one graded, one due tomorrow. Arte: an in-class exam last week (done) and one due next week.
type Due = { id: string; title: string; courseId: string; date: string; require: boolean; submitted?: boolean; graded?: { score: number | null; excused: boolean } };
const work: Due[] = [
  { id: 'A-over', title: 'Ensayo', courseId: 'C-mat', date: '2026-04-14T17:00:00Z', require: true },
  { id: 'A-old-over', title: 'Taller viejo', courseId: 'C-mat', date: '2026-04-02T17:00:00Z', require: true },
  { id: 'A-sent', title: 'Tarea 1', courseId: 'C-mat', date: '2026-04-13T17:00:00Z', require: true, submitted: true },
  { id: 'A-graded', title: 'Proyecto', courseId: 'C-mat', date: '2026-04-10T17:00:00Z', require: true, graded: { score: 4, excused: false } },
  { id: 'A-tomorrow', title: 'Quiz', courseId: 'C-mat', date: '2026-04-16T17:00:00Z', require: true },
  { id: 'A-exam', title: 'Examen', courseId: 'C-art', date: '2026-04-08T17:00:00Z', require: false },
  { id: 'A-next', title: 'Mural', courseId: 'C-art', date: '2026-04-21T17:00:00Z', require: false },
  { id: 'A-t2', title: 'Trimestre 2', courseId: 'C-art', date: '2026-06-10T17:00:00Z', require: true },
];

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
    student: {
      // The caller's own record (where.userId), or a child linked to them (where.parents).
      findFirst: jest.fn(async ({ where }) => {
        if (where.userId) return where.userId === 'u-ana' ? student : null;
        const linked = where.parents?.some?.userId === 'u-parent' && where.id === 'S-ana';
        return linked ? student : null;
      }),
    },
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
    assignmentDate: {
      findMany: jest.fn(async ({ where }) => {
        expect(where.classGroupId).toBe('G7A');
        return work.map((w) => ({
          date: new Date(w.date),
          assignment: {
            id: w.id,
            title: w.title,
            courseId: w.courseId,
            requireSubmission: w.require,
            submissions: w.submitted ? [{ id: 's' }] : [],
            grade: w.graded ? { published: true, studentGrades: [{ score: w.graded.score === null ? null : d(w.graded.score), excused: w.graded.excused }] } : null,
          },
        }));
      }),
    },
    studentGrade: {
      findMany: jest.fn(async ({ where }) => {
        expect(where.grade.published).toBe(true);
        return [
          grade('C-mat', 'T1', 'daily', 40, 4),
          grade('C-mat', 'T1', 'tests', 60, 2),
          grade('C-art', 'T1', 'tests', 100, 4.5),
          grade('C-mat', 'T2', 'tests', 100, 5),
        ].filter((g) => where.grade.periodId.in.includes(g.grade.periodId));
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

  describe('progress and stats (ACA-001-S03)', () => {
    it('counts done of total in the period @BR-ACA-001.7', async () => {
      const { service } = setup();
      const mine = await service.mine(ana, {});
      const byId = Object.fromEntries(mine.courses.map((c) => [c.id, c]));
      // Matemáticas: sent + graded done; two overdue and tomorrow's quiz not. Arte: last week's exam done.
      expect(byId['C-mat'].progress).toEqual({ done: 2, total: 5 });
      expect(byId['C-art'].progress).toEqual({ done: 1, total: 2 });
      expect(byId['C-cie'].progress).toEqual({ done: 0, total: 0 });
      expect([mine.stats.done, mine.stats.total]).toEqual([3, 7]);
    });

    it('shows the oldest overdue item, else the nearest one to do @BR-ACA-001.8', async () => {
      const { service } = setup();
      const mine = await service.mine(ana, {});
      const byId = Object.fromEntries(mine.courses.map((c) => [c.id, c]));
      expect(byId['C-mat'].next).toEqual({ assignmentId: 'A-old-over', title: 'Taller viejo', dueAt: '2026-04-02T17:00:00.000Z', overdue: true });
      expect(byId['C-art'].next).toMatchObject({ assignmentId: 'A-next', overdue: false });
      expect(byId['C-cie'].next).toBeNull();
      expect(mine.isCurrentPeriod).toBe(true);
    });

    it('has no Próxima entrega in another period @FR-ACA-001.5', async () => {
      const { service } = setup();
      const t2 = await service.mine(ana, { periodId: 'T2' });
      expect(t2.isCurrentPeriod).toBe(false);
      expect(t2.courses.every((c) => c.next === null)).toBe(true);
      expect(t2.courses.find((c) => c.id === 'C-art')?.progress).toEqual({ done: 0, total: 1 });
    });

    it("counts this week's work and its overdue items @BR-ACA-001.10", async () => {
      const { service } = setup();
      const { stats } = await service.mine(ana, {});
      // Mon 13 – Sun 19: Tarea 1 (sent), Ensayo (overdue), Quiz (tomorrow).
      expect(stats.week).toEqual({ due: 3, overdue: 1 });
    });

    it('averages the courses for the period and compares with the previous one @FR-ACA-001.6', async () => {
      const { service } = setup();
      const t1 = await service.mine(ana, {});
      // T1: Matemáticas 2.8, Arte 4.5 → 3.65 → 3.7 (one decimal); no previous period.
      expect(t1.stats.average).toEqual({ value: 3.7, previous: null, delta: null });
      const t2 = await service.mine(ana, { periodId: 'T2' });
      // T2: Matemáticas 5 only; previous T1 3.65.
      expect(t2.stats.average.value).toBe(5);
      expect(t2.stats.average.previous).toBe(3.7);
      expect(t2.stats.average.delta).toBe(1.4);
    });

    it('helpers: done and next', () => {
      const now = new Date('2026-04-15T12:00:00Z');
      expect(isDone('PRESENCIAL', new Date('2026-04-14T00:00:00Z'), now)).toBe(true);
      expect(isDone('PRESENCIAL', new Date('2026-04-16T00:00:00Z'), now)).toBe(false);
      expect(isDone('EXENTA', new Date('2026-04-16T00:00:00Z'), now)).toBe(true);
      expect(nextDelivery([], now)).toBeNull();
    });
  });

  describe('parents (ACA-001-S05)', () => {
    const parent = { userId: 'u-parent', organizationId: 'org-9', role: 'PARENT' } as never;

    it("shows a linked child's courses, whatever the parent's organization @FR-ACA-001.8", async () => {
      const { service } = setup();
      const mine = await service.mine(parent, { studentId: 'S-ana' });
      expect(mine.courses.map((c) => c.id)).toEqual(['C-art', 'C-cie', 'C-mat']);
      expect(mine.stats.total).toBe(7);
    });

    it('refuses a child who is not linked, and a parent without studentId @BR-ACA-001.2', async () => {
      const { service } = setup();
      await expect(service.mine(parent, { studentId: 'S-other' })).rejects.toThrow(new ForbiddenException(NOT_LINKED));
      await expect(service.mine(parent, {})).rejects.toThrow(new ForbiddenException(NO_STUDENT));
    });

    it("ignores studentId for a student: always their own courses", async () => {
      const { service, prisma } = setup();
      await service.mine(ana, { studentId: 'S-other' });
      expect(prisma.student.findFirst).toHaveBeenCalledTimes(1);
    });
  });
});

