import { courseAverage, meanOf } from '@/shared';
import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { pickCurrentPeriod } from '../home/home-period';
import { EnrollmentStatus } from '@generated/prisma';
import { CLOCK, Clock, schoolLocalTime } from '../home/home-time';
import { workStatus } from '../home/student-home.service';
import { PrismaService } from '../prisma.service';
import { CourseViewer } from './course-access.service';
import { CourseCoverStorage } from './course-cover-storage';
import { enrolledIn } from './course-roster';
import { courseSchedule } from './course-schedule';
import { courseBand, PERIOD_INVALID } from './courses-mine.service';
import { COURSE_DENIED, withResolvedColor } from './courses.service';
import {
  CourseGradesSummary,
  CoursePageSchedule,
  CourseParticipants,
  CourseParticipantTeacher,
  CourseWork,
  CourseWorkItem,
} from './entities/course-page.entity';

type Decimalish = { toNumber(): number } | number;
const num = (v: Decimalish) => (typeof v === 'number' ? v : v.toNumber());

/** The course page (ACA-001-S06): header data and the student's work, for the viewer from BR .3. */
@Injectable()
export class CoursePageService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly covers: CourseCoverStorage,
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
      /** FR-ACA-001.3: presigned; null keeps the color cover. */
      coverUrl: await this.covers.url(course.coverKey),
      /** FR-ACA-001.3: the course's teacher and admins may set its color and cover. */
      canCustomize: viewer.kind === 'STAFF',
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

  /**
   * FR-ACA-001.14: the student's grades in this course for one period: the average on the plan's
   * scale and its band (BR .5), one bar per category, and the published grades, most recent first.
   */
  async gradesSummary(courseId: string, viewer: CourseViewer, periodId?: string): Promise<CourseGradesSummary> {
    if (!viewer.student) throw new ForbiddenException(COURSE_DENIED);
    const studentId = viewer.student.id;
    const course = await this.prisma.course.findUniqueOrThrow({
      where: { id: courseId },
      select: {
        school: { select: { currentYear: true, timezone: true } },
        studyPlan: { select: { gradeMetric: { select: { maximum: true, minimumApproval: true } } } },
        gradeBuckets: { select: { id: true, name: true, weight: true }, orderBy: { createdAt: 'asc' } },
      },
    });
    const periods = await this.prisma.period.findMany({
      where: { year: course.school.currentYear },
      select: { id: true, name: true, startDate: true, endDate: true },
      orderBy: { startDate: 'asc' },
    });
    let selected = pickCurrentPeriod(periods, schoolLocalTime(this.clock.now(), course.school.timezone).date);
    if (periodId) {
      selected = periods.find((p) => p.id === periodId) ?? null;
      if (!selected) throw new BadRequestException(PERIOD_INVALID);
    }

    const metric = course.studyPlan.gradeMetric;
    const scale = metric ? { maximum: num(metric.maximum), minimumApproval: num(metric.minimumApproval) } : null;
    const grades = selected
      ? await this.prisma.grade.findMany({
          // Published only: students and parents never see drafts (BR-HOM-001.2).
          where: { courseId, periodId: selected.id, published: true },
          select: {
            id: true,
            title: true,
            date: true,
            bucketId: true,
            bucket: { select: { name: true } },
            studentGrades: { where: { studentId }, select: { score: true, excused: true, comments: true } },
          },
          orderBy: [{ date: 'desc' }, { title: 'asc' }],
        })
      : [];

    const rows = grades.map((g) => {
      const cell = g.studentGrades[0];
      const excused = cell?.excused ?? false;
      return {
        id: g.id,
        title: g.title,
        bucketId: g.bucketId,
        bucket: g.bucket.name,
        date: g.date.toISOString(),
        comment: cell?.comments ?? null,
        score: excused || cell?.score === null || cell?.score === undefined ? null : num(cell.score),
        excused,
      };
    });
    const weights = new Map(course.gradeBuckets.map((b) => [b.id, num(b.weight)]));
    const average = courseAverage(rows.map((r) => ({ bucketId: r.bucketId, weight: weights.get(r.bucketId) ?? 0, score: r.score })));

    return {
      periods: periods.map((p) => ({ id: p.id, name: p.name })),
      periodId: selected?.id ?? null,
      scale,
      average,
      band: courseBand(average, scale?.minimumApproval ?? null),
      buckets: course.gradeBuckets.map((b) => ({
        id: b.id,
        name: b.name,
        weight: num(b.weight),
        average: meanOf(rows.filter((r) => r.bucketId === b.id).map((r) => r.score)),
      })),
      grades: rows.map((r) => ({ id: r.id, title: r.title, bucket: r.bucket, date: r.date, comment: r.comment, score: r.score, excused: r.excused })),
    };
  }

  /**
   * FR-ACA-001.15: the course's teacher and, for a student or parent, the student's homeroom teacher
   * ("Docente consejero"); then the roster, names and initials only (BR .13). Parents get no students;
   * a homeroom teacher gets their group's students only (BR .16).
   */
  async participants(courseId: string, viewer: CourseViewer): Promise<CourseParticipants> {
    const course = await this.prisma.course.findUniqueOrThrow({
      where: { id: courseId },
      select: { teacher: { select: TEACHER_SELECT } },
    });
    const teachers = new Map<string, CourseParticipantTeacher>();
    const add = (t: TeacherRow | null | undefined, role: string) => {
      if (!t) return;
      const entry = teachers.get(t.id) ?? {
        id: t.id,
        name: `${t.firstName} ${t.fatherName}`,
        initials: `${t.firstName.charAt(0)}${t.fatherName.charAt(0)}`,
        color: t.user?.color ?? null,
        roles: [],
      };
      entry.roles.push(role);
      teachers.set(t.id, entry);
    };
    add(course.teacher, 'Docente');
    const group = viewer.student?.classGroup;
    if (group) {
      const homeroom = await this.prisma.classGroup.findUnique({
        where: { id: group.id },
        select: { teacher: { select: TEACHER_SELECT } },
      });
      add(homeroom?.teacher, 'Docente consejero');
    }

    const students =
      viewer.kind === 'PARENT'
        ? []
        : await this.prisma.student.findMany({
            where: {
              organizationId: viewer.organizationId,
              enrollmentStatus: EnrollmentStatus.ACTIVE,
              ...enrolledIn(courseId),
              ...(viewer.kind === 'HOMEROOM' ? { classGroup: { teacher: { userId: viewer.userId } } } : {}),
            },
            select: { id: true, firstName: true, fatherName: true },
            orderBy: [{ firstName: 'asc' }, { fatherName: 'asc' }],
          });

    const list = [...teachers.values()];
    return {
      teachers: list,
      students: students.map((st) => ({
        id: st.id,
        name: `${st.firstName} ${st.fatherName}`,
        initials: `${st.firstName.charAt(0)}${st.fatherName.charAt(0)}`,
      })),
      count: list.length + students.length,
    };
  }
}

const TEACHER_SELECT = { id: true, firstName: true, fatherName: true, user: { select: { color: true } } } as const;
type TeacherRow = { id: string; firstName: string; fatherName: string; user: { color: string | null } | null };

