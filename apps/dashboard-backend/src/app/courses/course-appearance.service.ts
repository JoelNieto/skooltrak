import { AuthUserContext } from '@/auth';
import { isCourseColor, SUBJECT_ICON_NAMES } from '@/shared';
import { CourseColor } from '@generated/prisma';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma.service';
import { CourseCoverStorage } from './course-cover-storage';

export const CUSTOMIZE_DENIED = 'Solo el docente del curso o un administrador puede personalizarlo';
export const COLOR_INVALID = 'Color de curso inválido';
export const ICON_INVALID = 'Ícono de curso inválido';
export const COVER_INVALID = 'La portada debe ser una imagen JPEG, PNG o WebP de hasta 2 MB';
export const COVER_MAX_BYTES = 2 * 1024 * 1024;
const COVER_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const ADMIN_ROLES = new Set(['ORG_ADMIN', 'ADMIN', 'SYSADMIN']);

/** What the upload interceptor hands over (multer's file, without its types package). */
export interface UploadedCover {
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/**
 * A course's color and cover photo (ACA-001 FR .3, BR .12): its teacher (with CUSTOMIZE_COURSES) or an
 * admin of its organization may change them, and nothing else about the course through this path.
 */
@Injectable()
export class CourseAppearanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: CourseCoverStorage,
  ) {}

  /** A field left undefined stays as it is; null goes back to the derived color or the subject's icon. */
  async setAppearance(
    user: AuthUserContext | undefined,
    courseId: string,
    input: { color?: string | null; icon?: string | null },
  ) {
    await this.assertCanCustomize(user, courseId);
    const { color, icon } = input;
    if (color != null && !isCourseColor(color)) throw new BadRequestException(COLOR_INVALID);
    if (icon != null && !(SUBJECT_ICON_NAMES as readonly string[]).includes(icon))
      throw new BadRequestException(ICON_INVALID);
    const updated = await this.prisma.course.update({
      where: { id: courseId },
      data: {
        ...(color !== undefined ? { color: color as CourseColor | null } : {}),
        ...(icon !== undefined ? { icon } : {}),
      },
      select: { color: true, icon: true },
    });
    return updated;
  }

  async uploadCover(user: AuthUserContext | undefined, courseId: string, file: UploadedCover | undefined) {
    const course = await this.assertCanCustomize(user, courseId);
    const ext = file ? COVER_TYPES[file.mimetype] : undefined;
    if (!file || !ext || file.size > COVER_MAX_BYTES || file.size === 0) throw new BadRequestException(COVER_INVALID);

    const key = `course-covers/${courseId}/${randomUUID()}.${ext}`;
    await this.storage.put(key, file.buffer, file.mimetype);
    await this.prisma.course.update({ where: { id: courseId }, data: { coverKey: key } });
    if (course.coverKey) await this.storage.remove(course.coverKey);
    console.log(`[CourseAppearance] cover set for course ${courseId} by user ${user?.userId}`);
    return { coverUrl: await this.storage.url(key) };
  }

  async removeCover(user: AuthUserContext | undefined, courseId: string) {
    const course = await this.assertCanCustomize(user, courseId);
    if (course.coverKey) {
      await this.prisma.course.update({ where: { id: courseId }, data: { coverKey: null } });
      await this.storage.remove(course.coverKey);
      console.log(`[CourseAppearance] cover removed for course ${courseId} by user ${user?.userId}`);
    }
    return { coverUrl: null };
  }

  /** BR .12: an admin of the course's organization, or its own teacher; 403 otherwise. */
  private async assertCanCustomize(user: AuthUserContext | undefined, courseId: string) {
    if (!user?.userId) throw new ForbiddenException('Not authenticated');
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { organizationId: true, teacherId: true, coverKey: true },
    });
    if (!course) throw new NotFoundException('Curso no encontrado');
    if (course.organizationId !== user.organizationId) throw new ForbiddenException(CUSTOMIZE_DENIED);
    if (ADMIN_ROLES.has(user.role?.toUpperCase() ?? '')) return course;
    const teacher = await this.prisma.teacher.findFirst({
      where: { userId: user.userId, organizationId: course.organizationId },
      select: { id: true },
    });
    if (!teacher || teacher.id !== course.teacherId) throw new ForbiddenException(CUSTOMIZE_DENIED);
    return course;
  }
}
