import { AuthUserContext } from '@/auth';
import { resolveCourseColor } from '@/shared';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CourseCoverStorage } from './course-cover-storage';
import { ACTIVE_ENROLLMENT } from './course-roster';

/** One "Cursos de {grupo}" section (ACA-001 FR .18). */
export interface HomeroomGroupCourses {
  group: { id: string; name: string };
  courses: HomeroomCourse[];
}

export interface HomeroomCourse {
  id: string;
  name: string;
  /** Resolved (BR .11): never null. */
  color: string;
  coverUrl: string | null;
  /** The course's icon (FR .3), else its subject's. */
  icon: string | null;
  /** FR-ACA-001.9: `area` feeds the card's area chip (BR .14). */
  subject: { name: string; area: string | null };
  teacher: { name: string } | null;
  /** The group's students actively enrolled in the course. */
  students: number;
}

/**
 * The courses a homeroom teacher (*docente consejero*, `ClassGroup.teacherId`) may open read-only
 * (ACA-001 FR .18, BR .16): per homeroom group, the colleagues' courses its students are enrolled in.
 * Teaching a group grants nothing here. Non-teachers and teachers with no homeroom group get `[]`.
 */
@Injectable()
export class CourseHomeroomService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly covers: CourseCoverStorage,
  ) {}

  async list(user: AuthUserContext | undefined): Promise<HomeroomGroupCourses[]> {
    if (!user?.userId || !user.organizationId || user.role?.toUpperCase() !== 'TEACHER') return [];
    const organizationId = user.organizationId;
    const groups = await this.prisma.classGroup.findMany({
      where: { organizationId, teacher: { userId: user.userId } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    const sections = await Promise.all(
      groups.map(async (group) => {
        const ofGroup = {
          ...ACTIVE_ENROLLMENT,
          student: { classGroupId: group.id, enrollmentStatus: 'ACTIVE' as const },
        };
        const courses = await this.prisma.course.findMany({
          where: {
            organizationId,
            enrollments: { some: ofGroup },
            // Their own courses are on their usual list.
            NOT: { teacher: { is: { userId: user.userId } } },
          },
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
            coverKey: true,
            subject: { select: { name: true, icon: true, area: true } },
            teacher: { select: { firstName: true, fatherName: true } },
            _count: { select: { enrollments: { where: ofGroup } } },
          },
          orderBy: { name: 'asc' },
        });
        return {
          group,
          courses: await Promise.all(
            courses.map(async (c) => ({
              id: c.id,
              name: c.name,
              color: resolveCourseColor(c.id, c.color),
              coverUrl: await this.covers.url(c.coverKey),
              icon: c.icon ?? c.subject?.icon ?? null,
              subject: { name: c.subject?.name ?? c.name, area: c.subject?.area ?? null },
              teacher: c.teacher ? { name: `${c.teacher.firstName} ${c.teacher.fatherName}` } : null,
              students: c._count.enrollments,
            })),
          ),
        };
      }),
    );
    return sections.filter((s) => s.courses.length > 0);
  }
}
