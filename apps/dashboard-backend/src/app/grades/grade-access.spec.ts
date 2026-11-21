import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

// The `@/auth` barrel pulls in better-auth's ESM build, which this Jest setup can't parse. The
// controllers only need the guards, decorators and Perm enum, so serve those from source.
jest.mock('@thallesp/nestjs-better-auth', () => ({ Session: () => () => undefined }));
jest.mock('../../../../../libs/auth/src/lib/prisma.service', () => ({ PrismaService: class {} }));
jest.mock('@/auth', () => ({
  ...jest.requireActual('../../../../../libs/auth/src/lib/auth.guard'),
  ...jest.requireActual('../../../../../libs/auth/src/lib/permissions/permissions.constants'),
}));
// The `@/shared` barrel also exports Angular code; the grade DTO only needs this decorator.
jest.mock('@/shared', () => ({ TransformDateToNoon: () => () => undefined }));
jest.mock('../prisma.service', () => ({ PrismaService: class {} }));
jest.mock('../courses/courses.service', () => ({ CoursesService: class {} }));
jest.mock('./grades.service', () => ({ GradesService: class {} }));
jest.mock('../student-grades/student-grades.service', () => ({ StudentGradesService: class {} }));
jest.mock('../grade-buckets/grade-buckets.service', () => ({ GradeBucketsService: class {} }));

import { Perm, PERMISSIONS_KEY } from '@/auth';
import { GradeBucketsController } from '../grade-buckets/grade-buckets.controller';
import { StudentGradesController } from '../student-grades/student-grades.controller';
import {
  BUCKET_MISMATCH,
  GradeAccessService,
  MOVE_DENIED,
  NOT_ENROLLED,
  READ_DENIED,
  UNPUBLISH_DENIED,
  WRITE_DENIED,
} from './grade-access.service';
import { GradesController } from './grades.controller';

/**
 * ASM-001-S01 — grade, student-grade and bucket endpoints check permission, organization and
 * ownership (BR-ASM-001.1, .9, .13). Runs the real controllers and GradeAccessService against an
 * in-memory stand-in for the few Prisma queries they make.
 */

// ── Fixture ────────────────────────────────────────────────────────────────────────────────────
// Org 1: course C1 (plan P1) taught by teacher-1. Groups G1 (homeroom: teacher-h) and G2, both P1.
// S1 is linked to C1; S2 was CSV-imported (no stored link, enrolled by plan); S3 is in G2.
// Org 2: course C2 and student S9.
const courses = [
  { id: 'C1', organizationId: 'org-1', studyPlanId: 'P1', teacherId: 'teacher-1' },
  { id: 'C2', organizationId: 'org-2', studyPlanId: 'P9', teacherId: 'teacher-9' },
];
const teachers = [
  { id: 'teacher-1', userId: 'u-teacher', organizationId: 'org-1' },
  { id: 'teacher-2', userId: 'u-teacher2', organizationId: 'org-1' },
  { id: 'teacher-h', userId: 'u-homeroom', organizationId: 'org-1' },
  { id: 'teacher-9', userId: 'u-teacher9', organizationId: 'org-2' },
];
const classGroups = [
  { id: 'G1', studyPlanId: 'P1', teacherId: 'teacher-h' },
  { id: 'G2', studyPlanId: 'P1', teacherId: null },
  { id: 'G9', studyPlanId: 'P9', teacherId: null },
];
const students = [
  { id: 'S1', userId: 'u-s1', organizationId: 'org-1', classGroupId: 'G1', courseIds: ['C1'], parentUserIds: ['u-parent'] },
  { id: 'S2', userId: 'u-s2', organizationId: 'org-1', classGroupId: 'G1', courseIds: [], parentUserIds: [] },
  { id: 'S3', userId: 'u-s3', organizationId: 'org-1', classGroupId: 'G2', courseIds: ['C1'], parentUserIds: [] },
  { id: 'S9', userId: 'u-s9', organizationId: 'org-2', classGroupId: 'G9', courseIds: ['C2'], parentUserIds: [] },
];
const grades = [
  { id: 'GR1', courseId: 'C1', published: true },
  { id: 'GR2', courseId: 'C1', published: false },
  { id: 'GR9', courseId: 'C2', published: true },
];
const studentGrades = [
  { id: 'SG1', gradeId: 'GR1', studentId: 'S1' },
  { id: 'SG2', gradeId: 'GR1', studentId: 'S2' },
  { id: 'SG3', gradeId: 'GR1', studentId: 'S3' },
  { id: 'SG-draft', gradeId: 'GR2', studentId: 'S1' },
  { id: 'SG9', gradeId: 'GR9', studentId: 'S9' },
];
const buckets = [
  { id: 'B1', courseId: 'C1' },
  { id: 'B9', courseId: 'C2' },
];

/** Evaluates the StudentWhereInput shapes GradeAccessService builds. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function studentMatches(s: (typeof students)[number], where: any): boolean {
  if (where.id && s.id !== where.id) return false;
  if (where.userId && s.userId !== where.userId) return false;
  if (where.organizationId && s.organizationId !== where.organizationId) return false;
  if (where.parents?.some?.userId && !s.parentUserIds.includes(where.parents.some.userId)) return false;
  const group = classGroups.find((g) => g.id === s.classGroupId);
  if (where.classGroup?.teacher) {
    const teacher = teachers.find((t) => t.id === group?.teacherId);
    const { userId, organizationId } = where.classGroup.teacher;
    if (!teacher || teacher.userId !== userId || teacher.organizationId !== organizationId) return false;
  }
  if (where.OR) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const any = where.OR.some((clause: any) =>
      clause.courses ? s.courseIds.includes(clause.courses.some.id) : group?.studyPlanId === clause.classGroup.studyPlanId,
    );
    if (!any) return false;
  }
  return true;
}

function fakePrisma() {
  return {
    course: { findUnique: async ({ where }: { where: { id: string } }) => courses.find((c) => c.id === where.id) ?? null },
    teacher: {
      findFirst: async ({ where }: { where: { userId: string; organizationId: string } }) =>
        teachers.find((t) => t.userId === where.userId && t.organizationId === where.organizationId) ?? null,
    },
    student: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findMany: async ({ where }: { where: any }) => students.filter((s) => studentMatches(s, where)).map((s) => ({ id: s.id })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      count: async ({ where }: { where: any }) => students.filter((s) => studentMatches(s, where)).length,
    },
    grade: { findUnique: async ({ where }: { where: { id: string } }) => grades.find((g) => g.id === where.id) ?? null },
    studentGrade: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const row = studentGrades.find((sg) => sg.id === where.id);
        if (!row) return null;
        const grade = grades.find((g) => g.id === row.gradeId)!;
        return { ...row, grade: { courseId: grade.courseId, published: grade.published } };
      },
    },
    gradeBucket: {
      findUnique: async ({ where }: { where: { id: string } }) => buckets.find((b) => b.id === where.id) ?? null,
      count: async ({ where }: { where: { id: string; courseId: string } }) =>
        buckets.filter((b) => b.id === where.id && b.courseId === where.courseId).length,
    },
  };
}

// ── Callers ────────────────────────────────────────────────────────────────────────────────────
const user = (userId: string, role: string, organizationId: string | null = 'org-1') => ({
  user: { userId, role, organizationId },
});
const TEACHER = user('u-teacher', 'TEACHER');
const OTHER_TEACHER = user('u-teacher2', 'TEACHER');
const HOMEROOM = user('u-homeroom', 'TEACHER');
const ADMIN = user('u-admin', 'ORG_ADMIN');
const STUDENT = user('u-s1', 'STUDENT');
const PARENT = user('u-parent', 'PARENT', 'org-elsewhere');

/** Service rows as the real services return them: grades with every student's row. */
const gradeWithRows = (id: string) => {
  const grade = grades.find((g) => g.id === id)!;
  return { ...grade, studentGrades: studentGrades.filter((sg) => sg.gradeId === id) };
};

function build() {
  const access = new GradeAccessService(fakePrisma() as never);
  const gradesService = {
    create: jest.fn().mockResolvedValue({ id: 'new' }),
    findByCourseId: jest.fn(async (courseId: string) => grades.filter((g) => g.courseId === courseId).map((g) => gradeWithRows(g.id))),
    findOne: jest.fn(async (id: string) => ({ ...gradeWithRows(id), course: { id: 'C1' } })),
    update: jest.fn().mockResolvedValue({ id: 'updated' }),
    remove: jest.fn().mockResolvedValue({ id: 'removed' }),
  };
  const studentGradesService = {
    create: jest.fn().mockResolvedValue({ id: 'new' }),
    findByCourseId: jest.fn(async (courseId: string, _periodId?: string, studentId?: string) =>
      studentGrades
        .filter((sg) => grades.find((g) => g.id === sg.gradeId && g.courseId === courseId && g.published))
        .filter((sg) => !studentId || sg.studentId === studentId),
    ),
    getAverageScoreForStudent: jest.fn().mockResolvedValue(4.5),
    findOne: jest.fn(async (id: string) => studentGrades.find((sg) => sg.id === id)),
    update: jest.fn().mockResolvedValue({ id: 'updated' }),
    remove: jest.fn().mockResolvedValue({ id: 'removed' }),
  };
  const bucketsService = {
    create: jest.fn().mockResolvedValue({ id: 'new' }),
    findManyByCourseId: jest.fn().mockResolvedValue([{ id: 'B1' }]),
    findOne: jest.fn().mockResolvedValue({ id: 'B1' }),
    update: jest.fn().mockResolvedValue({ id: 'updated' }),
    remove: jest.fn().mockResolvedValue({ id: 'removed' }),
  };
  return {
    access,
    gradesService,
    studentGradesService,
    bucketsService,
    gradesCtrl: new GradesController(gradesService as never, {} as never, access),
    studentGradesCtrl: new StudentGradesController(studentGradesService as never, access),
    bucketsCtrl: new GradeBucketsController(bucketsService as never, access),
  };
}

const refusedWith = (message: string) => expect.objectContaining({ message });

describe('ASM-001-S01 — grade endpoints are scoped (BR-ASM-001.13)', () => {
  describe('student', () => {
    it('cannot change a score, even with the write permission', async () => {
      const { studentGradesCtrl, studentGradesService } = build();
      await expect(studentGradesCtrl.update(STUDENT as never, { id: 'SG1', score: 5 } as never)).rejects.toEqual(
        refusedWith(WRITE_DENIED),
      );
      expect(studentGradesService.update).not.toHaveBeenCalled();
    });

    it("cannot read a classmate's grades", async () => {
      const { studentGradesCtrl } = build();
      await expect(studentGradesCtrl.findByCourseId(STUDENT as never, 'C1', undefined, 'S2')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      await expect(studentGradesCtrl.averageCourseScoreForStudent(STUDENT as never, 'S2', 'C1', 'p')).rejects.toEqual(
        refusedWith(READ_DENIED),
      );
    });

    it('reads own published grades, and only own rows without a studentId', async () => {
      const { studentGradesCtrl } = build();
      const own = await studentGradesCtrl.findByCourseId(STUDENT as never, 'C1', undefined, 'S1');
      expect(own.map((r) => r.id)).toEqual(['SG1']);
      const unfiltered = await studentGradesCtrl.findByCourseId(STUDENT as never, 'C1');
      expect(unfiltered.map((r) => r.id)).toEqual(['SG1']);
    });

    it('sees grade columns without drafts or classmates', async () => {
      const { gradesCtrl, studentGradesCtrl } = build();
      const rows = await gradesCtrl.findByCourseId(STUDENT as never, 'C1');
      expect(rows.map((g) => g.id)).toEqual(['GR1']);
      expect(rows[0].studentGrades.map((sg) => sg.studentId)).toEqual(['S1']);
      await expect(gradesCtrl.findOne(STUDENT as never, 'GR2')).rejects.toEqual(refusedWith(READ_DENIED));
      await expect(studentGradesCtrl.findOne(STUDENT as never, 'SG-draft')).rejects.toEqual(refusedWith(READ_DENIED));
    });

    it('counts a CSV-imported classmate as enrolled through the study plan', async () => {
      const { studentGradesCtrl } = build();
      const imported = user('u-s2', 'STUDENT');
      const rows = await studentGradesCtrl.findByCourseId(imported as never, 'C1', undefined, 'S2');
      expect(rows.map((r) => r.id)).toEqual(['SG2']);
    });

    it('cannot read a course they are not enrolled in', async () => {
      const { bucketsCtrl } = build();
      await expect(bucketsCtrl.findManyByCourseId(STUDENT as never, 'C2')).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('parent', () => {
    it('reads a linked child only, whatever organization the session is in', async () => {
      const { studentGradesCtrl } = build();
      const child = await studentGradesCtrl.findByCourseId(PARENT as never, 'C1', undefined, 'S1');
      expect(child.map((r) => r.id)).toEqual(['SG1']);
      await expect(studentGradesCtrl.findByCourseId(PARENT as never, 'C1', undefined, 'S2')).rejects.toEqual(
        refusedWith(READ_DENIED),
      );
    });
  });

  describe('teacher', () => {
    it('grades their own course', async () => {
      const { studentGradesCtrl, studentGradesService, gradesCtrl, gradesService } = build();
      await studentGradesCtrl.update(TEACHER as never, { id: 'SG1', score: 4 } as never);
      expect(studentGradesService.update).toHaveBeenCalledWith('SG1', { id: 'SG1', score: 4 }, true, 'u-teacher');
      await gradesCtrl.update(TEACHER as never, { id: 'GR2', published: true } as never);
      expect(gradesService.update).toHaveBeenCalled();
    });

    it('sees every row of their own course, drafts included', async () => {
      const { gradesCtrl } = build();
      const rows = await gradesCtrl.findByCourseId(TEACHER as never, 'C1');
      expect(rows.map((g) => g.id)).toEqual(['GR1', 'GR2']);
      expect(rows[0].studentGrades).toHaveLength(3);
    });

    it("cannot publish or edit another teacher's course", async () => {
      const { gradesCtrl, gradesService, bucketsCtrl } = build();
      await expect(gradesCtrl.update(OTHER_TEACHER as never, { id: 'GR2', published: true } as never)).rejects.toEqual(
        refusedWith(WRITE_DENIED),
      );
      await expect(bucketsCtrl.update(OTHER_TEACHER as never, { id: 'B1', weight: 50 } as never)).rejects.toEqual(
        refusedWith(WRITE_DENIED),
      );
      expect(gradesService.update).not.toHaveBeenCalled();
    });

    it('cannot unpublish; an admin can (BR-ASM-001.9)', async () => {
      const { gradesCtrl, gradesService } = build();
      await expect(gradesCtrl.update(TEACHER as never, { id: 'GR1', published: false } as never)).rejects.toEqual(
        refusedWith(UNPUBLISH_DENIED),
      );
      expect(gradesService.update).not.toHaveBeenCalled();
      await gradesCtrl.update(ADMIN as never, { id: 'GR1', published: false } as never);
      expect(gradesService.update).toHaveBeenCalledWith('GR1', { id: 'GR1', published: false }, 'u-admin', null);
    });

    it('cannot move a record to another course or student, or use another course\'s bucket', async () => {
      const { gradesCtrl, studentGradesCtrl, bucketsCtrl } = build();
      await expect(gradesCtrl.update(TEACHER as never, { id: 'GR1', courseId: 'C2' } as never)).rejects.toEqual(
        refusedWith(MOVE_DENIED),
      );
      await expect(studentGradesCtrl.update(TEACHER as never, { id: 'SG1', studentId: 'S2' } as never)).rejects.toEqual(
        refusedWith(MOVE_DENIED),
      );
      await expect(bucketsCtrl.update(TEACHER as never, { id: 'B1', courseId: 'C2' } as never)).rejects.toEqual(
        refusedWith(MOVE_DENIED),
      );
      await expect(
        gradesCtrl.create(TEACHER as never, { courseId: 'C1', bucketId: 'B9', title: 'Quiz', periodId: 'p', date: new Date() }),
      ).rejects.toEqual(refusedWith(BUCKET_MISMATCH));
    });

    it('only creates score rows for students enrolled in the course', async () => {
      const { studentGradesCtrl, studentGradesService } = build();
      await studentGradesCtrl.create(TEACHER as never, { gradeId: 'GR1', studentId: 'S2', score: 4 });
      expect(studentGradesService.create).toHaveBeenCalledTimes(1);
      await expect(
        studentGradesCtrl.create(TEACHER as never, { gradeId: 'GR1', studentId: 'S9', score: 4 }),
      ).rejects.toEqual(refusedWith(NOT_ENROLLED));
    });
  });

  describe('homeroom teacher (ACA-001 BR .16)', () => {
    it("reads published grades of their homeroom group's students only", async () => {
      const { gradesCtrl, studentGradesCtrl } = build();
      const rows = await gradesCtrl.findByCourseId(HOMEROOM as never, 'C1');
      expect(rows.map((g) => g.id)).toEqual(['GR1']);
      expect(rows[0].studentGrades.map((sg) => sg.studentId).sort()).toEqual(['S1', 'S2']);
      await expect(studentGradesCtrl.findByCourseId(HOMEROOM as never, 'C1', undefined, 'S3')).rejects.toEqual(
        refusedWith(READ_DENIED),
      );
    });

    it('cannot write', async () => {
      const { studentGradesCtrl } = build();
      await expect(studentGradesCtrl.update(HOMEROOM as never, { id: 'SG1', score: 1 } as never)).rejects.toEqual(
        refusedWith(WRITE_DENIED),
      );
    });
  });

  describe('admin', () => {
    it('reads and writes any course in their organization', async () => {
      const { gradesCtrl, bucketsCtrl, bucketsService } = build();
      expect(await gradesCtrl.findByCourseId(ADMIN as never, 'C1')).toHaveLength(2);
      await bucketsCtrl.remove(ADMIN as never, 'B1');
      expect(bucketsService.remove).toHaveBeenCalledWith('B1');
    });

    it('is refused on another organization', async () => {
      const { gradesCtrl, studentGradesCtrl, bucketsCtrl, gradesService } = build();
      await expect(gradesCtrl.update(ADMIN as never, { id: 'GR9', published: false } as never)).rejects.toEqual(
        refusedWith(WRITE_DENIED),
      );
      await expect(gradesCtrl.findByCourseId(ADMIN as never, 'C2')).rejects.toEqual(refusedWith(READ_DENIED));
      await expect(studentGradesCtrl.remove(ADMIN as never, 'SG9')).rejects.toEqual(refusedWith(WRITE_DENIED));
      await expect(bucketsCtrl.create(ADMIN as never, { courseId: 'C2', name: 'Tests', weight: 30 })).rejects.toEqual(
        refusedWith(WRITE_DENIED),
      );
      expect(gradesService.update).not.toHaveBeenCalled();
    });
  });

  it('returns 404 for unknown ids and 400 for a missing studentId on average', async () => {
    const { gradesCtrl, studentGradesCtrl } = build();
    await expect(gradesCtrl.remove(TEACHER as never, 'nope')).rejects.toBeInstanceOf(NotFoundException);
    await expect(studentGradesCtrl.averageCourseScoreForStudent(TEACHER as never, '', 'C1', 'p')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('ASM-001-S01 — every handler declares its permission', () => {
  const WRITES = new Set(['create', 'update', 'remove']);
  const controllers = [GradesController, StudentGradesController, GradeBucketsController];

  it.each(controllers.map((c) => [c.name, c] as const))('%s', (_name, controller) => {
    expect(Reflect.getMetadata(PERMISSIONS_KEY, controller)).toEqual([Perm.VIEW_GRADES]);
    const handlers = Object.getOwnPropertyNames(controller.prototype).filter(
      (name) => name !== 'constructor' && Reflect.getMetadata('path', controller.prototype[name]) !== undefined,
    );
    expect(handlers.length).toBeGreaterThan(0);
    for (const name of handlers) {
      const own = Reflect.getMetadata(PERMISSIONS_KEY, controller.prototype[name]);
      expect([name, own ?? Reflect.getMetadata(PERMISSIONS_KEY, controller)]).toEqual([
        name,
        WRITES.has(name) ? [Perm.MANAGE_GRADES] : [Perm.VIEW_GRADES],
      ]);
    }
  });

  it('no longer exposes the unscoped list routes', () => {
    expect('findAll' in GradesController.prototype).toBe(false);
    expect('findAll' in StudentGradesController.prototype).toBe(false);
  });
});
