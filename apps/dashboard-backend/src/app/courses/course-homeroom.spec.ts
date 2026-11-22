jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { CourseHomeroomService } from './course-homeroom.service';

/** ACA-001-S13 — "Cursos de {grupo}" for a homeroom teacher (FR .18, BR .16). */
function setup() {
  const classGroup = {
    findMany: jest.fn(async ({ where }) =>
      where.teacher.userId === 'u-hilda'
        ? [
            { id: 'G7A', name: '7°A' },
            { id: 'G8A', name: '8°A' },
          ]
        : [],
    ),
  };
  const course = {
    findMany: jest.fn(async ({ where }) => {
      expect(where.NOT).toEqual({ teacher: { is: { userId: 'u-hilda' } } });
      const groupId = where.enrollments.some.student.classGroupId;
      if (groupId !== 'G7A') return [];
      return [
        {
          id: 'C-mat',
          name: 'Matemáticas 7°',
          color: null,
          icon: null,
          coverKey: 'k',
          subject: { name: 'Matemáticas', icon: 'sigma' },
          teacher: { firstName: 'Tomás', fatherName: 'Docente' },
          _count: { enrollments: 3 },
        },
      ];
    }),
  };
  const covers = { url: jest.fn(async (key: string | null) => (key ? `https://r2.test/${key}` : null)) };
  return { classGroup, course, service: new CourseHomeroomService({ classGroup, course } as never, covers as never) };
}

const user = (userId: string, role: string) => ({ userId, role, organizationId: 'org-1' }) as never;

describe('CourseHomeroomService (ACA-001-S13)', () => {
  it("lists, per homeroom group, the colleagues' courses its students take; groups without any are left out @FR-ACA-001.18", async () => {
    const { service } = setup();
    const sections = await service.list(user('u-hilda', 'TEACHER'));
    expect(sections).toEqual([
      {
        group: { id: 'G7A', name: '7°A' },
        courses: [
          expect.objectContaining({
            id: 'C-mat',
            icon: 'sigma',
            coverUrl: 'https://r2.test/k',
            teacher: { name: 'Tomás Docente' },
            students: 3,
          }),
        ],
      },
    ]);
    expect(sections[0].courses[0].color).toBeTruthy();
  });

  it('is empty for a teacher with no homeroom group, and for other roles @BR-ACA-001.16', async () => {
    const { classGroup, service } = setup();
    await expect(service.list(user('u-other', 'TEACHER'))).resolves.toEqual([]);
    await expect(service.list(user('u-hilda', 'STUDENT'))).resolves.toEqual([]);
    await expect(service.list(user('u-admin', 'ORG_ADMIN'))).resolves.toEqual([]);
    expect(classGroup.findMany).toHaveBeenCalledTimes(1);
  });
});
