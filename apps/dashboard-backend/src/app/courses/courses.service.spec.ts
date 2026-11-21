import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));
// The `@/shared` barrel also exports Angular code; the service needs only the course appearance helpers.
jest.mock('@/shared', () => jest.requireActual('../../../../../libs/shared/src/lib/course-appearance'));

import { resolveCourseColor } from '@/shared';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCourseInput } from './dto/create-course.input';
import { UpdateCourseInput } from './dto/update-course.input';
import { COURSE_DENIED, CoursesService, STUDY_PLAN_NOT_FOUND, SUBJECT_NOT_FOUND, TEACHER_NOT_FOUND } from './courses.service';

/**
 * Course reads and writes are limited to the caller's organization. Runs the real service against
 * an in-memory stand-in for the Prisma queries it makes.
 */

type Row = Record<string, unknown>;

// Org 1: school SC1, plan P1, subject SB1, teacher T1, group G1, course C1.
// Org 2: school SC2, plan P2, subject SB2, teacher T2, group G2, course C2.
const fixture = () => ({
  school: [
    { id: 'SC1', organizationId: 'org-1' },
    { id: 'SC1b', organizationId: 'org-1' },
    { id: 'SC2', organizationId: 'org-2' },
  ],
  studyPlan: [
    { id: 'P1', schoolId: 'SC1', name: 'Primero', shortName: '1A' },
    { id: 'P1b', schoolId: 'SC1b', name: 'Segundo', shortName: '2A' },
    { id: 'P2', schoolId: 'SC2', name: 'Otro', shortName: 'O' },
  ],
  subject: [
    { id: 'SB1', organizationId: 'org-1', name: 'Matemáticas', code: 'MAT' },
    { id: 'SB2', organizationId: 'org-2', name: 'Historia', code: 'HIS' },
  ],
  teacher: [
    { id: 'T1', organizationId: 'org-1' },
    { id: 'T2', organizationId: 'org-2' },
  ],
  classGroup: [
    { id: 'G1', organizationId: 'org-1', studyPlanId: 'P1' },
    { id: 'G2', organizationId: 'org-2', studyPlanId: 'P2' },
  ],
  course: [
    { id: 'C1', organizationId: 'org-1', schoolId: 'SC1', subjectId: 'SB1', studyPlanId: 'P1', teacherId: 'T1', name: 'Mate 1' },
    { id: 'C1c', organizationId: 'org-1', schoolId: 'SC1', subjectId: 'SB1', studyPlanId: 'P1', teacherId: 'T1', name: 'Mate 2', color: 'TEAL' },
    { id: 'C2', organizationId: 'org-2', schoolId: 'SC2', subjectId: 'SB2', studyPlanId: 'P2', teacherId: 'T2', name: 'Historia 2' },
  ] as Row[],
  student: [] as Row[],
  courseEnrollment: [] as Row[],
});

/** Matches the subset of Prisma `where` the service uses: equality, `OR` (ignored), `school.organizationId`. */
function matches(db: ReturnType<typeof fixture>, row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (value === undefined || key === 'OR') return true;
    if (key === 'school') {
      const school = db.school.find((s) => s.id === row['schoolId']);
      return !!school && matches(db, school, value as Row);
    }
    if (typeof value === 'object' && value !== null) return true; // relation filters not used in these tests
    return row[key] === value;
  });
}

function prismaStub(db: ReturnType<typeof fixture>) {
  const model = (name: keyof ReturnType<typeof fixture>) => {
    const rows = () => db[name] as Row[];
    return {
      findFirst: jest.fn(async ({ where, include }: { where: Row; include?: Row }) => {
        const row = rows().find((r) => matches(db, r, where));
        if (!row) return null;
        return include?.['school'] ? { ...row, school: db.school.find((s) => s.id === row['schoolId']) } : { ...row };
      }),
      findUnique: jest.fn(async ({ where }: { where: Row }) => rows().find((r) => r['id'] === where['id']) ?? null),
      findMany: jest.fn(async ({ where }: { where?: Row; include?: Row } = {}) => rows().filter((r) => matches(db, r, where))),
      count: jest.fn(async ({ where }: { where?: Row } = {}) => rows().filter((r) => matches(db, r, where)).length),
      create: jest.fn(async ({ data }: { data: Row }) => {
        const row = { id: `new-${rows().length}`, ...data };
        rows().push(row);
        return row;
      }),
      update: jest.fn(async ({ where, data }: { where: Row; data: Row }) => {
        const row = rows().find((r) => r['id'] === where['id']);
        if (!row) throw new Error('not found');
        Object.assign(row, data);
        return row;
      }),
      delete: jest.fn(async ({ where }: { where: Row }) => {
        const index = rows().findIndex((r) => r['id'] === where['id']);
        return rows().splice(index, 1)[0];
      }),
      createMany: jest.fn(async ({ data }: { data: Row[] }) => {
        data.forEach((d, i) => rows().push({ id: `new-${rows().length + i}`, ...d }));
        return { count: data.length };
      }),
      deleteMany: jest.fn(async ({ where }: { where?: Row } = {}) => {
        const keep = rows().filter((r) => !matches(db, r, where));
        const count = rows().length - keep.length;
        rows().splice(0, rows().length, ...keep);
        return { count };
      }),
    };
  };
  const stub = {
    course: model('course'),
    subject: model('subject'),
    studyPlan: model('studyPlan'),
    teacher: model('teacher'),
    classGroup: model('classGroup'),
    student: model('student'),
    courseEnrollment: model('courseEnrollment'),
    // Both forms: an array of queries, or an interactive callback that gets the same client.
    $transaction: jest.fn((arg: Promise<unknown>[] | ((tx: unknown) => Promise<unknown>)) =>
      typeof arg === 'function' ? arg(stub) : Promise.all(arg),
    ),
  };
  return stub;
}

const ADMIN_1 = { userId: 'u-admin1', organizationId: 'org-1', role: 'ORG_ADMIN' };

function setup(user: Row | undefined = ADMIN_1) {
  const db = fixture();
  const prisma = prismaStub(db);
  const service = new CoursesService(prisma as never, { user } as never);
  return { db, prisma, service };
}

/** A create body that tries to place the course in org 2; the service must ignore that. */
const createInput = (overrides: Row = {}) =>
  ({
    name: '',
    code: 'NEW',
    shortName: '',
    organizationId: 'org-2',
    schoolId: 'SC2',
    subjectId: 'SB1',
    studyPlanId: 'P1',
    ...overrides,
  }) as never;

describe('CoursesService organization scope', () => {
  it('refuses a caller without an organization', async () => {
    const { service } = setup({ userId: 'u-x', organizationId: null, role: 'STUDENT' });
    await expect(service.findAll({} as never)).rejects.toThrow(new ForbiddenException(COURSE_DENIED));
  });

  describe('reads', () => {
    it('returns a course of the caller organization without its grades', async () => {
      const { service, prisma } = setup();
      await expect(service.findOne('C1')).resolves.toMatchObject({ id: 'C1' });
      const include = prisma.course.findFirst.mock.calls[0][0].include;
      expect(include).not.toHaveProperty('grades');
    });

    it('refuses a course of another organization', async () => {
      const { service } = setup();
      await expect(service.findOne('C2')).rejects.toThrow(new ForbiddenException(COURSE_DENIED));
    });

    it('lists and counts only the caller organization courses, even with another school id', async () => {
      const { service } = setup();
      const all = await service.findAll({ page: 1, pageSize: 10 } as never);
      expect(all.data.map((c: Row) => c['id'])).toEqual(['C1', 'C1c']);
      const other = await service.findAll({ page: 1, pageSize: 10, schoolId: 'SC2' } as never);
      expect(other.data).toEqual([]);
      await expect(service.count({ schoolId: 'SC2' } as never)).resolves.toBe(0);
      await expect(service.count({} as never)).resolves.toBe(2);
    });

    it('returns nothing for a school, subject, study plan or group of another organization', async () => {
      const { service } = setup();
      await expect(service.findManyBySchoolId('SC2')).resolves.toEqual([]);
      await expect(service.findManyBySubjectId('SB2')).resolves.toEqual([]);
      await expect(service.findManyByStudyPlanId('P2')).resolves.toEqual([]);
      await expect(service.findManyByGroupId('G2')).resolves.toEqual([]);
      await expect(service.findManyByGroupId('G1')).resolves.toHaveLength(2);
    });

    it('does not include grades when listing a group courses', async () => {
      const { service, prisma } = setup();
      await service.findManyByGroupId('G1');
      expect(prisma.course.findMany.mock.calls[0][0].include).not.toHaveProperty('grades');
    });
  });

  describe('writes', () => {
    it('refuses to update or delete a course of another organization', async () => {
      const { service, db } = setup();
      await expect(service.update('C2', { id: 'C2', name: 'Hacked' })).rejects.toThrow(
        new ForbiddenException(COURSE_DENIED),
      );
      await expect(service.remove('C2')).rejects.toThrow(new ForbiddenException(COURSE_DENIED));
      expect(db.course.find((c) => c['id'] === 'C2')).toMatchObject({ name: 'Historia 2' });
    });

    it('never moves a course to another organization or school through the body', async () => {
      const { service, db } = setup();
      await service.update('C1', { id: 'C1', name: 'Mate', organizationId: 'org-2', schoolId: 'SC2' });
      expect(db.course.find((c) => c['id'] === 'C1')).toMatchObject({
        name: 'Mate',
        organizationId: 'org-1',
        schoolId: 'SC1',
      });
    });

    it('takes the school from a new study plan of the same organization', async () => {
      const { service, db } = setup();
      await service.update('C1', { id: 'C1', studyPlanId: 'P1b' });
      expect(db.course.find((c) => c['id'] === 'C1')).toMatchObject({ studyPlanId: 'P1b', schoolId: 'SC1b' });
    });

    it('refuses a study plan, subject or teacher of another organization on update', async () => {
      const { service } = setup();
      await expect(service.update('C1', { id: 'C1', studyPlanId: 'P2' })).rejects.toThrow(
        new ConflictException(STUDY_PLAN_NOT_FOUND),
      );
      await expect(service.update('C1', { id: 'C1', subjectId: 'SB2' })).rejects.toThrow(
        new BadRequestException(SUBJECT_NOT_FOUND),
      );
      await expect(service.update('C1', { id: 'C1', teacherId: 'T2' })).rejects.toThrow(
        new BadRequestException(TEACHER_NOT_FOUND),
      );
    });

    it('deletes a course of the caller organization', async () => {
      const { service, db } = setup();
      await service.remove('C1');
      expect(db.course.map((c) => c['id'])).toEqual(['C1c', 'C2']);
    });

    it('refuses a study plan, subject or teacher of another organization on create', async () => {
      const { service, db } = setup();
      await expect(service.create(createInput({ studyPlanId: 'P2' }))).rejects.toThrow(
        new ConflictException(STUDY_PLAN_NOT_FOUND),
      );
      await expect(service.create(createInput({ subjectId: 'SB2' }))).rejects.toThrow(
        new BadRequestException(SUBJECT_NOT_FOUND),
      );
      await expect(service.create(createInput({ teacherId: 'T2' }))).rejects.toThrow(
        new BadRequestException(TEACHER_NOT_FOUND),
      );
      expect(db.course).toHaveLength(3);
    });

    it('creates the course in the study plan organization and school, ignoring the body', async () => {
      const { service, db } = setup();
      await service.create(createInput());
      expect(db.course[3]).toMatchObject({ organizationId: 'org-1', schoolId: 'SC1', studyPlanId: 'P1' });
    });
  });

  // The rules themselves are covered in course-roster.spec.ts; these prove the writes trigger them.
  describe('roster (ACA-001 BR .15)', () => {
    it("enrolls the study plan's students in a new course", async () => {
      const { service, db } = setup();
      db.student.push({ id: 'ST1', organizationId: 'org-1', classGroupId: 'G1' });

      await service.create(createInput());

      expect(db.courseEnrollment).toEqual([
        expect.objectContaining({ courseId: db.course[3]['id'], studentId: 'ST1', source: 'PLAN' }),
      ]);
    });

    it('replaces PLAN enrollments and keeps MANUAL ones when the study plan changes', async () => {
      const { service, db } = setup();
      db.student.push({ id: 'ST1', organizationId: 'org-1', classGroupId: 'G1' });
      db.courseEnrollment.push(
        { id: 'e1', courseId: 'C1', studentId: 'OLD', source: 'PLAN', excluded: true },
        { id: 'e2', courseId: 'C1', studentId: 'M', source: 'MANUAL', excluded: false },
      );

      await service.update('C1', { id: 'C1', studyPlanId: 'P1b' });

      expect(db.courseEnrollment.map((e) => `${e['studentId']}:${e['source']}`).sort()).toEqual(['M:MANUAL', 'ST1:PLAN']);
    });

    it('leaves the roster alone when the study plan does not change', async () => {
      const { service, db, prisma } = setup();
      db.courseEnrollment.push({ id: 'e1', courseId: 'C1', studentId: 'S1', source: 'PLAN', excluded: true });

      await service.update('C1', { id: 'C1', name: 'Mate', studyPlanId: 'P1' });

      expect(prisma.courseEnrollment.deleteMany).not.toHaveBeenCalled();
      expect(db.courseEnrollment).toHaveLength(1);
    });
  });
});

describe('Course color (ACA-001 BR .11)', () => {
  it('returns the chosen color, or a derived one flagged as default', async () => {
    const { service } = setup();
    await expect(service.findOne('C1c')).resolves.toMatchObject({ color: 'TEAL', colorIsDefault: false });
    await expect(service.findOne('C1')).resolves.toMatchObject({
      color: resolveCourseColor('C1', null),
      colorIsDefault: true,
    });
    const list = await service.findAll({ page: 1, pageSize: 10 } as never);
    expect(list.data.every((c: Row) => typeof c['color'] === 'string')).toBe(true);
  });

  it('saves a color and clears it with null', async () => {
    const { service, db } = setup();
    await service.update('C1', { id: 'C1', color: 'ROSE' });
    expect(db.course.find((c) => c['id'] === 'C1')).toMatchObject({ color: 'ROSE' });
    await service.update('C1', { id: 'C1', color: null });
    expect(db.course.find((c) => c['id'] === 'C1')?.['color']).toBeNull();
  });

  it('rejects any other color value (400)', async () => {
    const bad = await validate(plainToInstance(UpdateCourseInput, { id: 'C1', color: 'PURPLE' }));
    expect(bad.map((e) => e.property)).toEqual(['color']);
    const lower = await validate(plainToInstance(CreateCourseInput, { color: 'indigo' }));
    expect(lower.map((e) => e.property)).toEqual(['color']);
    await expect(validate(plainToInstance(UpdateCourseInput, { id: 'C1', color: 'INDIGO' }))).resolves.toEqual([]);
    await expect(validate(plainToInstance(UpdateCourseInput, { id: 'C1', color: null }))).resolves.toEqual([]);
    await expect(validate(plainToInstance(UpdateCourseInput, { id: 'C1', name: 'x' }))).resolves.toEqual([]);
  });
});
