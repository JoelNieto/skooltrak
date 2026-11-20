import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

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
    { id: 'C2', organizationId: 'org-2', schoolId: 'SC2', subjectId: 'SB2', studyPlanId: 'P2', teacherId: 'T2', name: 'Historia 2' },
  ] as Row[],
  student: [] as Row[],
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
    };
  };
  return {
    course: model('course'),
    subject: model('subject'),
    studyPlan: model('studyPlan'),
    teacher: model('teacher'),
    classGroup: model('classGroup'),
    student: model('student'),
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
}

const ADMIN_1 = { userId: 'u-admin1', organizationId: 'org-1', role: 'ORG_ADMIN' };

function setup(user: Row | undefined = ADMIN_1) {
  const db = fixture();
  const prisma = prismaStub(db);
  const service = new CoursesService(prisma as never, { user } as never);
  return { db, prisma, service };
}

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
      expect(all.data.map((c: Row) => c['id'])).toEqual(['C1']);
      const other = await service.findAll({ page: 1, pageSize: 10, schoolId: 'SC2' } as never);
      expect(other.data).toEqual([]);
      await expect(service.count({ schoolId: 'SC2' } as never)).resolves.toBe(0);
      await expect(service.count({} as never)).resolves.toBe(1);
    });

    it('returns nothing for a school, subject, study plan or group of another organization', async () => {
      const { service } = setup();
      await expect(service.findManyBySchoolId('SC2')).resolves.toEqual([]);
      await expect(service.findManyBySubjectId('SB2')).resolves.toEqual([]);
      await expect(service.findManyByStudyPlanId('P2')).resolves.toEqual([]);
      await expect(service.findManyByGroupId('G2')).resolves.toEqual([]);
      await expect(service.findManyByGroupId('G1')).resolves.toHaveLength(1);
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
      expect(db.course.map((c) => c['id'])).toEqual(['C2']);
    });

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
      expect(db.course).toHaveLength(2);
    });

    it('creates the course in the study plan organization and school, ignoring the body', async () => {
      const { service, db } = setup();
      await service.create(createInput());
      expect(db.course[2]).toMatchObject({ organizationId: 'org-1', schoolId: 'SC1', studyPlanId: 'P1' });
    });
  });
});
