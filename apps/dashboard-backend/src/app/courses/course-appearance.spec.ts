import { BadRequestException, ForbiddenException } from '@nestjs/common';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { Perm, PERMISSIONS_KEY } from '@/auth';
import { COLOR_INVALID, COVER_INVALID, CourseAppearanceService, CUSTOMIZE_DENIED } from './course-appearance.service';
import { CoursesController } from './courses.controller';

/** ACA-001-S09 — a course's color and cover photo (FR .3, BR .12). C1 (org-1) is taught by teacher-1. */
function setup(coverKey: string | null = null) {
  const course = { id: 'C1', organizationId: 'org-1', teacherId: 'teacher-1', coverKey, color: null as string | null };
  const stored: string[] = [];
  const removed: string[] = [];
  const prisma = {
    course: {
      findUnique: jest.fn(async ({ where }) => (where.id === 'C1' ? { ...course } : null)),
      update: jest.fn(async ({ data }) => Object.assign(course, data)),
    },
    teacher: {
      findFirst: jest.fn(async ({ where }) =>
        where.userId === 'u-teacher' ? { id: 'teacher-1' } : where.userId === 'u-teacher2' ? { id: 'teacher-2' } : null,
      ),
    },
  };
  const storage = {
    put: jest.fn(async (key: string) => void stored.push(key)),
    remove: jest.fn(async (key: string) => void removed.push(key)),
    url: jest.fn(async (key: string | null) => (key ? `https://r2.test/${key}?signed` : null)),
  };
  return { course, stored, removed, service: new CourseAppearanceService(prisma as never, storage as never) };
}

const user = (userId: string, role: string, organizationId = 'org-1') => ({ userId, role, organizationId }) as never;
const teacher = user('u-teacher', 'TEACHER');
const image = (mimetype: string, size: number) => ({ mimetype, size, buffer: Buffer.alloc(Math.min(size, 8)) });

describe('CourseAppearanceService (ACA-001-S09)', () => {
  it('the course teacher and an admin set the color; null goes back to the derived one @FR-ACA-001.3', async () => {
    const { course, service } = setup();
    await service.setColor(teacher, 'C1', 'TEAL');
    expect(course.color).toBe('TEAL');
    await service.setColor(user('u-admin', 'ORG_ADMIN'), 'C1', null);
    expect(course.color).toBeNull();
    await expect(service.setColor(teacher, 'C1', 'PURPLE')).rejects.toThrow(new BadRequestException(COLOR_INVALID));
  });

  it('refuses another teacher and another organization @BR-ACA-001.12', async () => {
    const { service } = setup();
    const denied = new ForbiddenException(CUSTOMIZE_DENIED);
    await expect(service.setColor(user('u-teacher2', 'TEACHER'), 'C1', 'TEAL')).rejects.toThrow(denied);
    await expect(service.setColor(user('u-admin9', 'ORG_ADMIN', 'org-2'), 'C1', 'TEAL')).rejects.toThrow(denied);
    await expect(service.uploadCover(user('u-teacher2', 'TEACHER'), 'C1', image('image/png', 100))).rejects.toThrow(denied);
  });

  it('stores a JPEG, PNG or WebP cover up to 2 MB and replaces the previous one', async () => {
    const { course, stored, removed, service } = setup('course-covers/C1/old.png');
    const result = await service.uploadCover(teacher, 'C1', image('image/webp', 2 * 1024 * 1024));
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatch(/^course-covers\/C1\/[0-9a-f-]+\.webp$/);
    expect(course.coverKey).toBe(stored[0]);
    expect(removed).toEqual(['course-covers/C1/old.png']);
    expect(result.coverUrl).toContain(stored[0]);
  });

  it('refuses other types, bigger files and no file with 400 @BR-ACA-001.12', async () => {
    const { stored, service } = setup();
    for (const file of [image('image/gif', 100), image('application/pdf', 100), image('image/png', 2 * 1024 * 1024 + 1), undefined]) {
      await expect(service.uploadCover(teacher, 'C1', file)).rejects.toThrow(new BadRequestException(COVER_INVALID));
    }
    expect(stored).toEqual([]);
  });

  it('removes the cover', async () => {
    const { course, removed, service } = setup('course-covers/C1/old.png');
    await expect(service.removeCover(teacher, 'C1')).resolves.toEqual({ coverUrl: null });
    expect(course.coverKey).toBeNull();
    expect(removed).toEqual(['course-covers/C1/old.png']);
  });

  it('needs CUSTOMIZE_COURSES on the routes', () => {
    for (const handler of ['setAppearance', 'uploadCover', 'removeCover'] as const) {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, CoursesController.prototype[handler])).toEqual([Perm.CUSTOMIZE_COURSES]);
    }
  });
});
