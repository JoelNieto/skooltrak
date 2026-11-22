import { AuthUserContext } from '@/auth';
import { resolveCourseColor } from '@/shared';
import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { averageKey, weightedAverages } from '../home/home-grades';
import { pickCurrentPeriod } from '../home/home-period';
import { CLOCK, Clock, schoolLocalTime } from '../home/home-time';
import { PrismaService } from '../prisma.service';
import { courseSchedule, scheduleText } from './course-schedule';
import { enrolledCourses } from './course-roster';
import { MyCourseBand, MyCourses } from './entities/my-courses.entity';

export const NO_STUDENT = 'No student profile in this organization';
export const PERIOD_INVALID = 'El periodo no pertenece al año escolar actual';

type Decimalish = { toNumber(): number } | number;
const num = (v: Decimalish) => (typeof v === 'number' ? v : v.toNumber());

/** BR-ACA-001.5 */
export function courseBand(average: number | null, passMark: number | null): MyCourseBand | null {
  if (average === null || passMark === null) return null;
  return Math.round(average * 10) / 10 < passMark ? 'EN_RIESGO' : 'AL_DIA';
}

/** The student's *Mis cursos* (ACA-001-S02, FR .4 .5). Scope: BR-ACA-001.1. */
@Injectable()
export class CoursesMineService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async mine(user: AuthUserContext | undefined, query: { periodId?: string }): Promise<MyCourses> {
    if (!user?.userId) throw new ForbiddenException('Not authenticated');
    if (!user.organizationId) throw new ForbiddenException('Organization context required');

    // BR-HOM-001.8: the caller's own Student record in their organization.
    const student = await this.prisma.student.findFirst({
      where: { userId: user.userId, organizationId: user.organizationId },
      select: {
        id: true,
        organizationId: true,
        classGroup: { select: { id: true, name: true } },
        school: { select: { currentYear: true, timezone: true } },
      },
    });
    if (!student) throw new ForbiddenException(NO_STUDENT);

    const periods = await this.prisma.period.findMany({
      where: { year: student.school.currentYear },
      select: { id: true, name: true, startDate: true, endDate: true },
      orderBy: { startDate: 'asc' },
    });
    let periodId: string | null;
    if (query.periodId) {
      if (!periods.some((p) => p.id === query.periodId)) throw new BadRequestException(PERIOD_INVALID);
      periodId = query.periodId;
    } else {
      periodId = pickCurrentPeriod(periods, schoolLocalTime(this.clock.now(), student.school.timezone).date)?.id ?? null;
    }

    // BR-ACA-001.1 / .15: the courses the student is enrolled in.
    const courses = await this.prisma.course.findMany({
      where: { organizationId: student.organizationId, ...enrolledCourses({ id: student.id }) },
      select: {
        id: true,
        name: true,
        color: true,
        subject: { select: { name: true, icon: true } },
        teacher: { select: { firstName: true, fatherName: true, user: { select: { color: true } } } },
        studyPlan: { select: { gradeMetric: { select: { maximum: true, minimumApproval: true } } } },
      },
    });
    const courseIds = courses.map((c) => c.id);

    const [slots, scores] = await Promise.all([
      student.classGroup && courseIds.length
        ? this.prisma.classGroupWeeklySchedule.findMany({
            where: { classGroupId: student.classGroup.id, courseId: { in: courseIds } },
            select: { courseId: true, weekday: true, startTime: true, endTime: true, location: true, remote: true, recess: true },
          })
        : Promise.resolve([]),
      periodId && courseIds.length
        ? this.prisma.studentGrade.findMany({
            // Published grades only (BR-HOM-001.2).
            where: { studentId: student.id, grade: { courseId: { in: courseIds }, periodId, published: true } },
            select: {
              studentId: true,
              score: true,
              grade: { select: { courseId: true, periodId: true, bucketId: true, bucket: { select: { weight: true } } } },
            },
          })
        : Promise.resolve([]),
    ]);
    const averages = weightedAverages(scores);

    const cards = courses.map((course) => {
      const metric = course.studyPlan.gradeMetric;
      const scale = metric ? { maximum: num(metric.maximum), minimumApproval: num(metric.minimumApproval) } : null;
      const average = periodId ? (averages.get(averageKey(student.id, course.id, periodId)) ?? null) : null;
      const teacher = course.teacher;
      return {
        id: course.id,
        name: course.name,
        color: resolveCourseColor(course.id, course.color),
        subject: { name: course.subject.name, icon: course.subject.icon },
        teacher: teacher
          ? {
              name: `${teacher.firstName} ${teacher.fatherName}`,
              initials: `${teacher.firstName.charAt(0)}${teacher.fatherName.charAt(0)}`,
              color: teacher.user?.color ?? null,
            }
          : null,
        schedule: scheduleText(courseSchedule(slots.filter((s) => s.courseId === course.id))),
        average,
        band: courseBand(average, scale?.minimumApproval ?? null),
        scale,
      };
    });
    cards.sort((a, b) => a.subject.name.localeCompare(b.subject.name, 'es') || a.name.localeCompare(b.name, 'es'));

    return {
      periods: periods.map((p) => ({
        id: p.id,
        name: p.name,
        startDate: p.startDate.toISOString(),
        endDate: p.endDate.toISOString(),
      })),
      periodId,
      classGroup: student.classGroup,
      courses: cards,
    };
  }
}
