import { ForbiddenException } from '@nestjs/common';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { CourseAccessService } from './course-access.service';
import { CoursePageService } from './course-page.service';
import { COURSE_DENIED } from './courses.service';

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
      findUniqueOrThrow: jest.fn(async () => ({ school: { timezone: 'America/Panama' } })),
    },
    teacher: {
      findFirst: jest.fn(async ({ where }) =>
        where.userId === 'u-teacher' ? { id: 'teacher-1' } : where.userId === 'u-teacher2' || where.userId === 'u-homeroom' ? { id: 'teacher-x' } : null,
      ),
    },
    student: {
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
  const page = () => new CoursePageService(prismaFake() as never, { now: () => new Date('2026-04-15T12:00:00Z') });
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
