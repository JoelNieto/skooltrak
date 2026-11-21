import { BadRequestException, ForbiddenException } from '@nestjs/common';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { Perm, PERMISSIONS_KEY } from '@/auth';
import { Prisma } from '@generated/prisma';
import { WRITE_DENIED, GradeAccessService } from '../grades/grade-access.service';
import { GradebookController } from './gradebook.controller';
import { GROUP_INVALID, GradebookService, NO_GROUP, PERIOD_INVALID, SCHOOL_DENIED } from './gradebook.service';

/**
 * ASM-001-S02 — the read-only gradebook (FR-ASM-001.1, .2, .3, .5; BR .1, .4, .5, .6). Runs the
 * real service and GradeAccessService against an in-memory stand-in for the Prisma queries.
 */

// ── Fixture ────────────────────────────────────────────────────────────────────────────────────
// Org 1, school SCH1 (year 2026): C1 taught by teacher-1, C2 by teacher-2. Org 2: C9.
// C1's roster: Carla, Ana (7°A), Beto (7°B), Dani (no group), Eva (withdrawn), plus Félix who is
// in 7°A but not on the roster. Pass mark 3.0.
const d = (n: number) => new Prisma.Decimal(n);
const courses = [
  { id: 'C1', name: 'Matemáticas', organizationId: 'org-1', schoolId: 'SCH1', studyPlanId: 'P1', teacherId: 'teacher-1', metric: true },
  { id: 'C2', name: 'Ciencias', organizationId: 'org-1', schoolId: 'SCH1', studyPlanId: 'P1', teacherId: 'teacher-2', metric: false },
  { id: 'C9', name: 'Otra', organizationId: 'org-2', schoolId: 'SCH9', studyPlanId: 'P9', teacherId: 'teacher-9', metric: true },
];
const teachers = [
  { id: 'teacher-1', userId: 'u-teacher', organizationId: 'org-1' },
  { id: 'teacher-2', userId: 'u-teacher2', organizationId: 'org-1' },
  { id: 'teacher-9', userId: 'u-teacher9', organizationId: 'org-2' },
];
const G7A = { id: 'G7A', name: '7°A' };
const G7B = { id: 'G7B', name: '7°B' };
const students = [
  { id: 'S-carla', firstName: 'Carla', fatherName: 'Díaz', classGroup: G7A, active: true, courseIds: ['C1'] },
  { id: 'S-ana', firstName: 'Ana', fatherName: 'Pérez', classGroup: G7A, active: true, courseIds: ['C1'] },
  { id: 'S-beto', firstName: 'Beto', fatherName: 'Ruiz', classGroup: G7B, active: true, courseIds: ['C1'] },
  { id: 'S-dani', firstName: 'Dani', fatherName: 'Gil', classGroup: null, active: true, courseIds: ['C1'] },
  { id: 'S-eva', firstName: 'Eva', fatherName: 'Mora', classGroup: G7A, active: false, courseIds: ['C1'] },
  { id: 'S-felix', firstName: 'Félix', fatherName: 'Sol', classGroup: G7A, active: true, courseIds: [] },
];
const periods = [
  { id: 'T1', name: 'Trimestre 1', year: 2026, startDate: new Date('2026-03-01'), endDate: new Date('2026-05-31') },
  { id: 'T2', name: 'Trimestre 2', year: 2026, startDate: new Date('2026-06-01'), endDate: new Date('2026-08-31') },
  { id: 'OLD', name: 'Trimestre 3', year: 2025, startDate: new Date('2025-09-01'), endDate: new Date('2025-11-30') },
];
const buckets = [
  { id: 'B-daily', courseId: 'C1', name: 'Trabajo diario', weight: d(40), createdAt: new Date('2026-01-01') },
  { id: 'B-tests', courseId: 'C1', name: 'Pruebas', weight: d(60), createdAt: new Date('2026-01-02') },
  { id: 'B-empty', courseId: 'C1', name: 'Proyectos', weight: d(20), createdAt: new Date('2026-01-03') },
];
const at = (day: number) => new Date(Date.UTC(2026, 3, day));
type Row = { id: string; studentId: string; score: Prisma.Decimal | null; updatedAt: Date };
const sg = (id: string, studentId: string, score: number | null, updatedAt = at(1)): Row => ({
  id,
  studentId,
  score: score === null ? null : d(score),
  updatedAt,
});
// T1 columns. Ana: daily 4, 4, 4, 4 · tests 2 → BR .4 example, 2.8. Carla: tests only (a draft) 3.2.
const grades = [
  ...[1, 2, 3, 4].map((n) => ({
    id: `G-d${n}`,
    courseId: 'C1',
    periodId: 'T1',
    bucketId: 'B-daily',
    title: `Tarea ${n}`,
    date: at(n),
    published: true,
    studentGrades: [sg(`sg-d${n}-ana`, 'S-ana', 4)],
  })),
  {
    id: 'G-t1',
    courseId: 'C1',
    periodId: 'T1',
    bucketId: 'B-tests',
    title: 'Prueba 1',
    date: at(10),
    published: true,
    // A duplicated row for Ana: the most recently updated one (2) wins.
    studentGrades: [sg('sg-t1-ana-old', 'S-ana', 5, at(1)), sg('sg-t1-ana', 'S-ana', 2, at(9)), sg('sg-t1-beto', 'S-beto', 4)],
  },
  {
    id: 'G-t2',
    courseId: 'C1',
    periodId: 'T1',
    bucketId: 'B-tests',
    title: 'Prueba 2',
    date: at(12),
    published: false,
    studentGrades: [sg('sg-t2-carla', 'S-carla', 3.2), sg('sg-t2-ana', 'S-ana', null)],
  },
  { id: 'G-other', courseId: 'C1', periodId: 'T2', bucketId: 'B-tests', title: 'Prueba T2', date: at(30), published: false, studentGrades: [] },
];

function fakePrisma() {
  const courseRef = (c: (typeof courses)[number]) => ({
    id: c.id,
    organizationId: c.organizationId,
    studyPlanId: c.studyPlanId,
    teacherId: c.teacherId,
  });
  return {
    school: {
      findFirst: jest.fn(async ({ where }) =>
        courses.some((c) => c.schoolId === where.id && c.organizationId === where.organizationId) ? { id: where.id } : null,
      ),
    },
    teacher: {
      findFirst: jest.fn(async ({ where }) =>
        teachers.find((t) => t.userId === where.userId && t.organizationId === where.organizationId) ?? null,
      ),
    },
    course: {
      findUnique: jest.fn(async ({ where }) => {
        const c = courses.find((x) => x.id === where.id);
        return c ? courseRef(c) : null;
      }),
      findUniqueOrThrow: jest.fn(async ({ where }) => {
        const c = courses.find((x) => x.id === where.id);
        if (!c) throw new Error(`course ${where.id}`);
        return {
          id: c.id,
          name: c.name,
          organizationId: c.organizationId,
          school: { currentYear: 2026, timezone: 'America/Panama' },
          studyPlan: {
            gradeMetric: c.metric ? { minimum: d(1), maximum: d(5), minimumApproval: d(3), minimumExcellence: d(4.5) } : null,
          },
        };
      }),
      findMany: jest.fn(async ({ where }) =>
        courses
          .filter(
            (c) =>
              c.schoolId === where.schoolId &&
              c.organizationId === where.organizationId &&
              (where.teacherId === undefined || c.teacherId === where.teacherId),
          )
          .map((c) => ({ id: c.id, name: c.name })),
      ),
    },
    period: {
      findMany: jest.fn(async ({ where }) => periods.filter((p) => p.year === where.year)),
    },
    student: {
      findMany: jest.fn(async ({ where }) => {
        const courseId = where.courseEnrollments.some.courseId;
        expect(where.courseEnrollments.some.excluded).toBe(false);
        expect(where.enrollmentStatus).toBe('ACTIVE');
        return students
          .filter((s) => s.active && s.courseIds.includes(courseId))
          .sort((a, b) => a.firstName.localeCompare(b.firstName))
          .map((s) => ({
            id: s.id,
            firstName: s.firstName,
            fatherName: s.fatherName,
            documentId: `ID-${s.firstName}`,
            classGroup: s.classGroup,
            user: { color: '#123' },
          }));
      }),
    },
    gradeBucket: {
      findMany: jest.fn(async ({ where }) => buckets.filter((b) => b.courseId === where.courseId)),
    },
    grade: {
      findMany: jest.fn(async ({ where, select }) => {
        const ids: string[] = select.studentGrades.where.studentId.in;
        return grades
          .filter((g) => g.courseId === where.courseId && g.periodId === where.periodId)
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .map((g) => ({ ...g, studentGrades: g.studentGrades.filter((r) => ids.includes(r.studentId)) }));
      }),
    },
    $queryRaw: jest.fn(async () => [
      { courseId: 'C2', at: new Date('2026-04-20') },
      { courseId: 'C1', at: new Date('2026-04-10') },
    ]),
  };
}

const teacher = { userId: 'u-teacher', organizationId: 'org-1', role: 'TEACHER' } as never;
const teacher2 = { userId: 'u-teacher2', organizationId: 'org-1', role: 'TEACHER' } as never;
const admin = { userId: 'u-admin', organizationId: 'org-1', role: 'ORG_ADMIN' } as never;
const otherAdmin = { userId: 'u-admin9', organizationId: 'org-2', role: 'ORG_ADMIN' } as never;

function setup(now = new Date('2026-04-15T15:00:00Z')) {
  const prisma = fakePrisma();
  const service = new GradebookService(prisma as never, new GradeAccessService(prisma as never), { now: () => now }, {} as never);
  return { prisma, service };
}

describe('GradebookService (ASM-001-S02)', () => {
  it('needs MANAGE_GRADES on every route', () => {
    expect(Reflect.getMetadata(PERMISSIONS_KEY, GradebookController)).toEqual([Perm.MANAGE_GRADES]);
  });

  describe('gradebook', () => {
    it('lists the first group on the roster, active students only, by first name @FR-ASM-001.2', async () => {
      const { service } = setup();
      const book = await service.gradebook(teacher, 'C1', {});
      expect(book.classGroups).toEqual([
        { id: 'G7A', name: '7°A', studentCount: 2 },
        { id: 'G7B', name: '7°B', studentCount: 1 },
        { id: null, name: 'Sin grupo', studentCount: 1 },
      ]);
      expect(book.classGroupId).toBe('G7A');
      expect(book.rows.map((r) => r.student.name)).toEqual(['Ana Pérez', 'Carla Díaz']);
    });

    it('groups the period columns by bucket, leaving out buckets without one @FR-ASM-001.2', async () => {
      const { service } = setup();
      const book = await service.gradebook(teacher, 'C1', {});
      expect(book.buckets.map((b) => [b.name, b.weight, b.columns.map((c) => c.title)])).toEqual([
        ['Trabajo diario', 40, ['Tarea 1', 'Tarea 2', 'Tarea 3', 'Tarea 4']],
        ['Pruebas', 60, ['Prueba 1', 'Prueba 2']],
      ]);
      expect(book.buckets[1].columns[1].published).toBe(false);
    });

    it('averages each bucket mean by weight, drafts included @BR-ASM-001.4 @BR-ASM-001.6', async () => {
      const { service } = setup();
      const book = await service.gradebook(teacher, 'C1', {});
      const [ana, carla] = book.rows;
      expect(ana.cells.map((c) => c.score)).toEqual([4, 4, 4, 4, 2, null]);
      expect(ana.cells[4].studentGradeId).toBe('sg-t1-ana');
      expect(ana.average).toBeCloseTo(2.8, 10);
      expect(carla.average).toBeCloseTo(3.2, 10);
      expect(book.includesDrafts).toBe(true);
    });

    it('bands each average against the pass mark @BR-ASM-001.5', async () => {
      const { service } = setup();
      const book = await service.gradebook(teacher, 'C1', {});
      expect(book.rows.map((r) => r.status)).toEqual(['AT_RISK', 'WATCH']);
      const beto = (await service.gradebook(teacher, 'C1', { classGroupId: 'G7B' })).rows[0];
      expect([beto.student.name, beto.average, beto.status]).toEqual(['Beto Ruiz', 4, 'ON_TRACK']);
    });

    it('averages the footer per column and over the students @FR-ASM-001.2', async () => {
      const { service } = setup();
      const book = await service.gradebook(teacher, 'C1', {});
      expect(book.footer.columns.map((c) => c.average)).toEqual([4, 4, 4, 4, 2, 3.2]);
      expect(book.footer.average).toBeCloseTo(3, 10);
    });

    it('lists students without a group under "none", with no average when unscored', async () => {
      const { service } = setup();
      const book = await service.gradebook(teacher, 'C1', { classGroupId: NO_GROUP });
      expect(book.classGroupId).toBeNull();
      expect(book.rows.map((r) => [r.student.name, r.average, r.status])).toEqual([['Dani Gil', null, null]]);
      expect(book.footer.average).toBeNull();
      expect(book.includesDrafts).toBe(false);
    });

    it('defaults to the current period and offers the current year only @FR-ASM-001.3', async () => {
      const { service } = setup(new Date('2026-07-01T15:00:00Z'));
      const book = await service.gradebook(teacher, 'C1', {});
      expect(book.periods.map((p) => p.id)).toEqual(['T1', 'T2']);
      expect(book.periodId).toBe('T2');
      expect(book.buckets.map((b) => b.columns.map((c) => c.title))).toEqual([['Prueba T2']]);
      expect(book.includesDrafts).toBe(false);
    });

    it('refuses a period of another year and a group that is not on the roster', async () => {
      const { service } = setup();
      await expect(service.gradebook(teacher, 'C1', { periodId: 'OLD' })).rejects.toThrow(new BadRequestException(PERIOD_INVALID));
      await expect(service.gradebook(teacher, 'C1', { classGroupId: 'G-elsewhere' })).rejects.toThrow(
        new BadRequestException(GROUP_INVALID),
      );
    });

    it('has no status bands without a grade metric', async () => {
      const { service } = setup();
      const book = await service.gradebook(teacher2, 'C2', {});
      expect(book.metric).toBeNull();
      expect(book.rows).toEqual([]);
    });

    it("refuses another teacher's course and another organization's @BR-ASM-001.1", async () => {
      const { service } = setup();
      await expect(service.gradebook(teacher2, 'C1', {})).rejects.toThrow(new ForbiddenException(WRITE_DENIED));
      await expect(service.gradebook(otherAdmin, 'C1', {})).rejects.toThrow(new ForbiddenException(WRITE_DENIED));
      await expect(service.gradebook(admin, 'C1', {})).resolves.toMatchObject({ classGroupId: 'G7A' });
    });
  });

  describe('courses', () => {
    it("lists the teacher's own courses @FR-ASM-001.1", async () => {
      const { service } = setup();
      const { courses: list } = await service.courses(teacher, 'SCH1');
      expect(list).toEqual([{ id: 'C1', name: 'Matemáticas', lastGradedAt: '2026-04-10T00:00:00.000Z' }]);
    });

    it('lists every course of the school for an admin, last graded first', async () => {
      const { service } = setup();
      const { courses: list } = await service.courses(admin, 'SCH1');
      expect(list.map((c) => c.id)).toEqual(['C2', 'C1']);
    });

    it("refuses another organization's school", async () => {
      const { service } = setup();
      await expect(service.courses(teacher, 'SCH9')).rejects.toThrow(new ForbiddenException(SCHOOL_DENIED));
    });
  });

  describe('exportCsv (ASM-001-S07)', () => {
    it('exports the saved view with a file name @FR-ASM-001.13', async () => {
      const { service } = setup();
      const { filename, csv } = await service.exportCsv(teacher, 'C1', {});
      expect(filename).toBe('calificaciones-matematicas-trimestre-1-7-a.csv');
      const lines = csv.split('\r\n');
      expect(lines[0]).toBe('Estudiante,Cédula,Tarea 1,Tarea 2,Tarea 3,Tarea 4,Prueba 1,Prueba 2,Promedio,Estado');
      expect(lines[1]).toBe('Ana Pérez,ID-Ana,4.0,4.0,4.0,4.0,2.0,,2.8,En riesgo');
    });

    it("refuses another teacher's course @BR-ASM-001.1", async () => {
      const { service } = setup();
      await expect(service.exportCsv(teacher2, 'C1', {})).rejects.toThrow(new ForbiddenException(WRITE_DENIED));
    });
  });
});

