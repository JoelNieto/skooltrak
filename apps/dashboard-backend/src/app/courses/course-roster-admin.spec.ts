import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { Perm, PERMISSIONS_KEY } from '@/auth';
import { CourseRosterAdminService, NOT_ON_ROSTER, STUDENT_NOT_ELIGIBLE } from './course-roster-admin.service';
import { CoursesController } from './courses.controller';
import { COURSE_DENIED } from './courses.service';

/**
 * ACA-001-S12 — an admin manages a course's roster (FR .19, BR .15). Course C1 (org-1, school S1):
 * Ana is on it by plan, Beto was added manually; Carla (S1) is not on it; Dani is in school S2.
 */
type Row = {
  id: string;
  courseId: string;
  studentId: string;
  source: 'PLAN' | 'MANUAL';
  excluded: boolean;
  addedById: string | null;
};

function setup() {
  const students: Record<
    string,
    { id: string; firstName: string; fatherName: string; documentId: string; schoolId: string; organizationId: string }
  > = {
    ana: {
      id: 'ana',
      firstName: 'Ana',
      fatherName: 'Pérez',
      documentId: '8-1',
      schoolId: 'S1',
      organizationId: 'org-1',
    },
    beto: {
      id: 'beto',
      firstName: 'Beto',
      fatherName: 'Ruiz',
      documentId: '8-2',
      schoolId: 'S1',
      organizationId: 'org-1',
    },
    carla: {
      id: 'carla',
      firstName: 'Carla',
      fatherName: 'Díaz',
      documentId: '8-3',
      schoolId: 'S1',
      organizationId: 'org-1',
    },
    dani: {
      id: 'dani',
      firstName: 'Dani',
      fatherName: 'Mora',
      documentId: '8-4',
      schoolId: 'S2',
      organizationId: 'org-1',
    },
  };
  let rows: Row[] = [
    { id: 'e1', courseId: 'C1', studentId: 'ana', source: 'PLAN', excluded: false, addedById: null },
    { id: 'e2', courseId: 'C1', studentId: 'beto', source: 'MANUAL', excluded: false, addedById: 'u-admin' },
  ];
  const view = (r: Row) => ({
    source: r.source,
    excluded: r.excluded,
    createdAt: new Date('2026-11-01'),
    addedBy: r.addedById ? { firstName: 'Ada', lastName: 'Admin', name: null } : null,
    student: { ...students[r.studentId], classGroup: null },
  });
  const find = (where: { courseId_studentId: { courseId: string; studentId: string } }) =>
    rows.find(
      (r) => r.courseId === where.courseId_studentId.courseId && r.studentId === where.courseId_studentId.studentId,
    );
  const prisma = {
    course: {
      findUnique: jest.fn(async ({ where }) =>
        where.id === 'C1' ? { id: 'C1', organizationId: 'org-1', schoolId: 'S1' } : null,
      ),
    },
    student: {
      findFirst: jest.fn(async ({ where }) => {
        const s = students[where.id];
        return s && s.organizationId === where.organizationId && s.schoolId === where.schoolId ? { id: s.id } : null;
      }),
    },
    courseEnrollment: {
      findMany: jest.fn(async () => rows.map(view)),
      findUnique: jest.fn(async ({ where }) => find(where) ?? null),
      findUniqueOrThrow: jest.fn(async ({ where }) => view(find(where) as Row)),
      create: jest.fn(async ({ data }) => rows.push({ id: `e${rows.length + 1}`, excluded: false, ...data })),
      update: jest.fn(async ({ where, data }) => Object.assign(rows.find((r) => r.id === where.id) as Row, data)),
      delete: jest.fn(async ({ where }) => (rows = rows.filter((r) => r.id !== where.id))),
    },
  };
  return { rows: () => rows, service: new CourseRosterAdminService(prisma as never) };
}

const admin = { userId: 'u-admin', role: 'ORG_ADMIN', organizationId: 'org-1' } as never;

describe('CourseRosterAdminService (ACA-001-S12)', () => {
  it('lists each student with their origin @FR-ACA-001.19', async () => {
    const { service } = setup();
    const roster = await service.roster(admin, 'C1');
    expect(roster.map((e) => [e.student.name, e.source, e.excluded])).toEqual([
      ['Ana Pérez', 'PLAN', false],
      ['Beto Ruiz', 'MANUAL', false],
    ]);
    expect(roster[1].addedBy).toBe('Ada Admin');
  });

  it('adds a student outside the plan as MANUAL, and adding again changes nothing @BR-ACA-001.15', async () => {
    const { rows, service } = setup();
    const entry = await service.add(admin, 'C1', 'carla');
    expect(entry).toEqual(expect.objectContaining({ source: 'MANUAL', excluded: false }));
    expect(rows().find((r) => r.studentId === 'carla')).toEqual(
      expect.objectContaining({ source: 'MANUAL', addedById: 'u-admin' }),
    );
    await service.add(admin, 'C1', 'carla');
    expect(rows().filter((r) => r.studentId === 'carla')).toHaveLength(1);
  });

  it('refuses a student of another school with 400 @BR-ACA-001.15', async () => {
    const { service } = setup();
    await expect(service.add(admin, 'C1', 'dani')).rejects.toThrow(new BadRequestException(STUDENT_NOT_ELIGIBLE));
    await expect(service.add(admin, 'C1', 'nobody')).rejects.toThrow(new BadRequestException(STUDENT_NOT_ELIGIBLE));
  });

  it('removing excludes a PLAN enrollment (restorable) and deletes a MANUAL one @BR-ACA-001.15', async () => {
    const { rows, service } = setup();
    await service.remove(admin, 'C1', 'ana');
    expect(rows().find((r) => r.studentId === 'ana')).toEqual(
      expect.objectContaining({ source: 'PLAN', excluded: true }),
    );
    await service.remove(admin, 'C1', 'beto');
    expect(rows().find((r) => r.studentId === 'beto')).toBeUndefined();

    await expect(service.remove(admin, 'C1', 'ana')).rejects.toThrow(new NotFoundException(NOT_ON_ROSTER));
    await expect(service.remove(admin, 'C1', 'carla')).rejects.toThrow(new NotFoundException(NOT_ON_ROSTER));

    const restored = await service.add(admin, 'C1', 'ana');
    expect(restored).toEqual(expect.objectContaining({ source: 'PLAN', excluded: false }));
  });

  it('refuses an admin of another organization', async () => {
    const { service } = setup();
    const outsider = { userId: 'u-x', role: 'ORG_ADMIN', organizationId: 'org-2' } as never;
    await expect(service.roster(outsider, 'C1')).rejects.toThrow(new ForbiddenException(COURSE_DENIED));
    await expect(service.add(outsider, 'C1', 'carla')).rejects.toThrow(new ForbiddenException(COURSE_DENIED));
  });

  it('needs MANAGE_COURSES on every roster route', () => {
    for (const handler of ['getRoster', 'getRosterCandidates', 'addToRoster', 'removeFromRoster'] as const) {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, CoursesController.prototype[handler])).toEqual([Perm.MANAGE_COURSES]);
    }
  });
});
