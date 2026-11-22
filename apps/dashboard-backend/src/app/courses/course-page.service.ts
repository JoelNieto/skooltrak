import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { CLOCK, Clock, schoolLocalTime } from '../home/home-time';
import { workStatus } from '../home/student-home.service';
import { PrismaService } from '../prisma.service';
import { CourseViewer } from './course-access.service';
import { courseSchedule } from './course-schedule';
import { COURSE_DENIED, withResolvedColor } from './courses.service';
import { CoursePageSchedule, CourseWork, CourseWorkItem } from './entities/course-page.entity';

type Decimalish = { toNumber(): number } | number;
const num = (v: Decimalish) => (typeof v === 'number' ? v : v.toNumber());

/** The course page (ACA-001-S06): header data and the student's work, for the viewer from BR .3. */
@Injectable()
export class CoursePageService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /**
   * FR-ACA-001.10: the course, plus who is looking, the student's group and the schedule for it.
   * Looked up by the course's own organization: a parent's child may be in another (BR-HOM-001.9).
   */
  async course(id: string, viewer: CourseViewer) {
    const course = await this.prisma.course.findFirst({
      where: { id, organizationId: viewer.organizationId },
      include: {
        school: true,
        subject: true,
        teacher: { include: { user: { select: { id: true, firstName: true, lastName: true, color: true, image: true } } } },
        studyPlan: { include: { gradeMetric: true } },
      },
    });
    if (!course) throw new ForbiddenException(COURSE_DENIED);

    let schedule: CoursePageSchedule | null = null;
    const group = viewer.student?.classGroup;
    if (group) {
      const slots = await this.prisma.classGroupWeeklySchedule.findMany({
        where: { classGroupId: group.id, courseId: id },
        select: { weekday: true, startTime: true, endTime: true, location: true, remote: true, recess: true },
      });
      schedule = courseSchedule(slots);
    }

    return {
      ...withResolvedColor(course),
      viewer: { kind: viewer.kind, student: viewer.student },
      classGroup: group ?? null,
      schedule,
    };
  }

  /** FR-ACA-001.12, .13: the student's work in this course, with status (BR-ACA-001.6). */
  async work(courseId: string, viewer: CourseViewer): Promise<CourseWork> {
    if (!viewer.student) throw new ForbiddenException(COURSE_DENIED);
    const student = viewer.student;
    const school = await this.prisma.course.findUniqueOrThrow({
      where: { id: courseId },
      select: { school: { select: { timezone: true } } },
    });
    const timezone = schoolLocalTime(this.clock.now(), school.school.timezone).timezone;
    if (!student.classGroup) return { timezone, pending: 0, upcoming: [], past: [] };

    const now = this.clock.now();
    const dates = await this.prisma.assignmentDate.findMany({
      where: { classGroupId: student.classGroup.id, assignment: { courseId } },
      select: {
        date: true,
        assignment: {
          select: {
            id: true,
            title: true,
            type: true,
            requireSubmission: true,
            submissions: { where: { studentId: student.id }, select: { id: true } },
            grade: {
              select: {
                published: true,
                studentGrades: { where: { studentId: student.id }, select: { score: true, excused: true } },
              },
            },
          },
        },
      },
    });

    const items: CourseWorkItem[] = dates.map(({ date, assignment }) => {
      const cell = assignment.grade?.published ? assignment.grade.studentGrades[0] : undefined;
      const graded = cell ? { score: cell.score === null ? null : num(cell.score), excused: cell.excused } : null;
      const status = workStatus(
        { dueAt: date, requireSubmission: assignment.requireSubmission, submitted: assignment.submissions.length > 0, graded },
        now,
      );
      return {
        assignmentId: assignment.id,
        title: assignment.title,
        type: assignment.type,
        dueAt: date.toISOString(),
        status,
        score: status === 'CALIFICADA' ? (graded?.score ?? null) : null,
      };
    });
    const nowIso = now.toISOString();
    return {
      timezone,
      pending: items.filter((i) => i.status === 'PENDIENTE' || i.status === 'VENCIDA').length,
      upcoming: items.filter((i) => i.dueAt >= nowIso).sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
      past: items.filter((i) => i.dueAt < nowIso).sort((a, b) => b.dueAt.localeCompare(a.dueAt)),
    };
  }
}
