import { ForbiddenException } from '@nestjs/common';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { CourseAccessService } from './course-access.service';
import { CoursePageService } from './course-page.service';
import { PERIOD_INVALID } from './courses-mine.service';
import { COURSE_DENIED } from './courses.service';

const d = (n: number) => ({ toNumber: () => n });

/**
 * ACA-001-S06 — course page access (BR .3) and the student's work list (FR .12, .13).
 * Course C1 (org-1) is taught by teacher-1. Ana and Beto (group 7°A, homeroom teacher u-homeroom)
 * are enrolled; Félix (7°B) is not. Ana's parent is u-parent, in another organization.
 */
const STUDENTS = [
  { id: 'S-ana', firstName: 'Ana', userId: 'u-ana', organizationId: 'org-1', enrolled: true, parents: ['u-parent'], classGroup: { id: 'G7A', name: '7°A' }, homeroom: 'u-homeroom' },
  { id: 'S-beto', firstName: 'Beto', userId: 'u-beto', organizationId: 'org-1', enrolled: true, parents: [], classGroup: { id: 'G7A', name: '7°A' }, homeroom: 'u-homeroom' },
  { id: 'S-felix', firstName: 'Félix', userId: 'u-felix', organizationId: 'org-1', enrolled: false, parents: ['u-parent'], classGroup: { id: 'G7B', name: '7°B' }, homeroom: null },
];

function prismaFake() {
  const match = (s: (typeof STUDENTS)[number], where: Record<string, any>) =>
    (!where.id || s.id === where.id) &&
    (!where.userId || s.userId === where.userId) &&
    s.organizationId === where.organizationId &&
    (!where.courseEnrollments || s.enrolled) &&
    (!where.parents || s.parents.includes(where.parents.some.userId)) &&
    (!where.classGroup || s.homeroom === where.classGroup.teacher.userId);
  return {
    course: {
      findUnique: jest.fn(async ({ where }) => (where.id === 'C1' ? { organizationId: 'org-1', teacherId: 'teacher-1' } : null)),
      findUniqueOrThrow: jest.fn(async () => ({
        teacher: { id: 'teacher-1', firstName: 'Tomás', fatherName: 'Docente', user: { color: '#336' } },
        school: { timezone: 'America/Panama', currentYear: 2026 },
        studyPlan: { gradeMetric: { maximum: d(5), minimumApproval: d(3) } },
        gradeBuckets: [
          { id: 'B-daily', name: 'Trabajo diario', weight: d(40) },
          { id: 'B-tests', name: 'Pruebas', weight: d(60) },
          { id: 'B-proj', name: 'Proyectos', weight: d(20) },
        ],
      })),
    },
    period: {
      findMany: jest.fn(async () => [
        { id: 'T1', name: 'Trimestre 1', startDate: new Date('2026-03-01'), endDate: new Date('2026-05-31') },
        { id: 'T2', name: 'Trimestre 2', startDate: new Date('2026-06-01'), endDate: new Date('2026-08-31') },
      ]),
    },
    grade: {
      findMany: jest.fn(async ({ where }) => {
        expect(where.published).toBe(true);
        if (where.periodId !== 'T1') return [];
        const g = (id: string, title: string, bucketId: string, bucket: string, date: string, cell: object | null) => ({
          id,
          title,
          date: new Date(date),
          bucketId,
          bucket: { name: bucket },
          studentGrades: cell ? [cell] : [],
        });
        return [
          g('G4', 'Prueba 1', 'B-tests', 'Pruebas', '2026-04-12T12:00:00Z', { score: d(2), excused: false, comments: 'Repasar' }),
          g('G3', 'Tarea 3', 'B-daily', 'Trabajo diario', '2026-04-10T12:00:00Z', { score: null, excused: true, comments: null }),
          g('G2', 'Tarea 2', 'B-daily', 'Trabajo diario', '2026-04-05T12:00:00Z', { score: d(4), excused: false, comments: null }),
          g('G1', 'Tarea 1', 'B-daily', 'Trabajo diario', '2026-04-01T12:00:00Z', null),
        ];
      }),
    },
    teacher: {
      findFirst: jest.fn(async ({ where }) =>
        where.userId === 'u-teacher' ? { id: 'teacher-1' } : where.userId === 'u-teacher2' || where.userId === 'u-homeroom' ? { id: 'teacher-x' } : null,
      ),
    },
    classGroup: {
      findUnique: jest.fn(async ({ where }) =>
        where.id === 'G7A' ? { teacher: { id: 'teacher-h', firstName: 'Hilda', fatherName: 'Guía', user: null } } : { teacher: null },
      ),
    },
    student: {
      findMany: jest.fn(async ({ where }) => {
        expect(where.enrollmentStatus).toBe('ACTIVE');
        expect(Object.keys(where)).not.toContain('select');
        return STUDENTS.filter((s) => match(s, where)).map((s) => ({ id: s.id, firstName: s.firstName, fatherName: 'E2E' }));
      }),
      count: jest.fn(async ({ where }) => STUDENTS.filter((s) => match(s, where)).length),
      findFirst: jest.fn(async ({ where }) => {
        const s = STUDENTS.find((x) => match(x, where));
        return s ? { id: s.id, firstName: s.firstName, classGroup: s.classGroup } : null;
      }),
    },
    assignmentDate: {
      findMany: jest.fn(async () => [
        work('A-due', 'Quiz', '2026-04-16T17:00:00Z', true),
        work('A-over', 'Ensayo', '2026-04-10T17:00:00Z', true),
        work('A-sent', 'Tarea', '2026-04-12T17:00:00Z', true, true),
        work('A-exam', 'Examen', '2026-04-20T17:00:00Z', false),
      ]),
    },
  };
}
const work = (id: string, title: string, date: string, require: boolean, submitted = false) => ({
  date: new Date(date),
  assignment: { id, title, type: 'HOMEWORK', requireSubmission: require, submissions: submitted ? [{ id: 's' }] : [], grade: null },
});

const user = (userId: string, role: string, organizationId = 'org-1') => ({ userId, role, organizationId }) as never;

describe('CourseAccessService.viewer (BR-ACA-001.3)', () => {
  const access = () => new CourseAccessService(prismaFake() as never);

  it('lets in admins and the course teacher as staff', async () => {
    await expect(access().viewer(user('u-admin', 'ORG_ADMIN'), 'C1')).resolves.toMatchObject({ kind: 'STAFF' });
    await expect(access().viewer(user('u-teacher', 'TEACHER'), 'C1')).resolves.toMatchObject({ kind: 'STAFF' });
  });

  it("lets a homeroom teacher of enrolled students in, read-only (BR .16)", async () => {
    await expect(access().viewer(user('u-homeroom', 'TEACHER'), 'C1')).resolves.toMatchObject({ kind: 'HOMEROOM', student: null });
  });

  it('lets in the enrolled student, and the parent of an enrolled linked child in any organization', async () => {
    await expect(access().viewer(user('u-ana', 'STUDENT'), 'C1')).resolves.toMatchObject({ kind: 'STUDENT', student: { id: 'S-ana' } });
    await expect(access().viewer(user('u-parent', 'PARENT', 'org-9'), 'C1', 'S-ana')).resolves.toMatchObject({
      kind: 'PARENT',
      student: { id: 'S-ana' },
    });
    // Without studentId: the first linked child enrolled in the course.
    await expect(access().viewer(user('u-parent', 'PARENT', 'org-9'), 'C1')).resolves.toMatchObject({ student: { id: 'S-ana' } });
  });

  it('refuses everyone else with 403', async () => {
    const denied = new ForbiddenException(COURSE_DENIED);
    await expect(access().viewer(user('u-teacher2', 'TEACHER'), 'C1')).rejects.toThrow(denied);
    await expect(access().viewer(user('u-felix', 'STUDENT'), 'C1')).rejects.toThrow(denied);
    await expect(access().viewer(user('u-parent', 'PARENT'), 'C1', 'S-felix')).rejects.toThrow(denied);
    await expect(access().viewer(user('u-admin9', 'ORG_ADMIN', 'org-2'), 'C1')).rejects.toThrow(denied);
  });
});

describe('CoursePageService.work (FR-ACA-001.12, .13)', () => {
  const page = () => new CoursePageService(prismaFake() as never, { now: () => new Date('2026-04-15T12:00:00Z') }, { url: async () => null } as never);
  const ana = { kind: 'STUDENT' as const, organizationId: 'org-1', student: { id: 'S-ana', firstName: 'Ana', classGroup: { id: 'G7A', name: '7°A' } } };

  it('splits upcoming (soonest first) and past (most recent first), and counts what is pending', async () => {
    const work = await page().work('C1', ana);
    expect(work.upcoming.map((i) => [i.title, i.status])).toEqual([
      ['Quiz', 'PENDIENTE'],
      ['Examen', 'PRESENCIAL'],
    ]);
    expect(work.past.map((i) => [i.title, i.status])).toEqual([
      ['Tarea', 'ENTREGADO'],
      ['Ensayo', 'VENCIDA'],
    ]);
    expect(work.pending).toBe(2);
  });

  it('is for students and parents only', async () => {
    await expect(page().work('C1', { kind: 'STAFF', organizationId: 'org-1', student: null })).rejects.toThrow(
      new ForbiddenException(COURSE_DENIED),
    );
  });
});

describe('CoursePageService.gradesSummary (FR-ACA-001.14)', () => {
  const page = () => new CoursePageService(prismaFake() as never, { now: () => new Date('2026-04-15T12:00:00Z') }, { url: async () => null } as never);
  const ana = { kind: 'STUDENT' as const, organizationId: 'org-1', student: { id: 'S-ana', firstName: 'Ana', classGroup: { id: 'G7A', name: '7°A' } } };

  it('averages the period, bands it, and gives one bar per category @BR-ACA-001.5', async () => {
    const summary = await page().gradesSummary('C1', ana);
    // Trabajo diario 4 (excused and empty skipped), Pruebas 2: (4 × 40 + 2 × 60) / 100 = 2.8.
    expect(summary.periodId).toBe('T1');
    expect(summary.average).toBeCloseTo(2.8, 10);
    expect(summary.band).toBe('EN_RIESGO');
    expect(summary.scale).toEqual({ maximum: 5, minimumApproval: 3 });
    expect(summary.buckets.map((b) => [b.name, b.weight, b.average])).toEqual([
      ['Trabajo diario', 40, 4],
      ['Pruebas', 60, 2],
      ['Proyectos', 20, null],
    ]);
  });

  it('lists the published grades, most recent first, with comment, score or Exenta', async () => {
    const { grades } = await page().gradesSummary('C1', ana);
    expect(grades.map((g) => [g.title, g.bucket, g.score, g.excused, g.comment])).toEqual([
      ['Prueba 1', 'Pruebas', 2, false, 'Repasar'],
      ['Tarea 3', 'Trabajo diario', null, true, null],
      ['Tarea 2', 'Trabajo diario', 4, false, null],
      ['Tarea 1', 'Trabajo diario', null, false, null],
    ]);
  });

  it('switches period, refuses one outside the year, and is for students and parents only', async () => {
    const t2 = await page().gradesSummary('C1', ana, 'T2');
    expect([t2.periodId, t2.average, t2.band, t2.grades]).toEqual(['T2', null, null, []]);
    await expect(page().gradesSummary('C1', ana, 'OLD')).rejects.toThrow(PERIOD_INVALID);
    await expect(page().gradesSummary('C1', { kind: 'STAFF', organizationId: 'org-1', student: null })).rejects.toThrow(
      new ForbiddenException(COURSE_DENIED),
    );
  });
});

describe('CoursePageService.participants (FR-ACA-001.15, BR .13)', () => {
  const page = () => new CoursePageService(prismaFake() as never, { now: () => new Date('2026-04-15T12:00:00Z') }, { url: async () => null } as never);
  const student = { id: 'S-ana', firstName: 'Ana', classGroup: { id: 'G7A', name: '7°A' } };

  it("a student sees the course teacher, their homeroom teacher, and classmates' names only", async () => {
    const p = await page().participants('C1', { kind: 'STUDENT', organizationId: 'org-1', student });
    expect(p.teachers).toEqual([
      { id: 'teacher-1', name: 'Tomás Docente', initials: 'TD', color: '#336', roles: ['Docente'] },
      { id: 'teacher-h', name: 'Hilda Guía', initials: 'HG', color: null, roles: ['Docente consejero'] },
    ]);
    expect(p.students).toEqual([
      { id: 'S-ana', name: 'Ana E2E', initials: 'AE' },
      { id: 'S-beto', name: 'Beto E2E', initials: 'BE' },
    ]);
    expect(p.count).toBe(4);
  });

  it('a parent sees teachers only @BR-ACA-001.13', async () => {
    const p = await page().participants('C1', { kind: 'PARENT', organizationId: 'org-1', student });
    expect(p.students).toEqual([]);
    expect(p.count).toBe(2);
  });

  it("staff see the roster; a homeroom teacher only their group's students (BR .16)", async () => {
    const staff = await page().participants('C1', { kind: 'STAFF', organizationId: 'org-1', student: null });
    expect(staff.teachers.map((t) => t.roles)).toEqual([['Docente']]);
    expect(staff.students).toHaveLength(2);
    const homeroom = await page().participants('C1', { kind: 'HOMEROOM', organizationId: 'org-1', student: null, userId: 'u-nobody' });
    expect(homeroom.students).toEqual([]);
  });
});

