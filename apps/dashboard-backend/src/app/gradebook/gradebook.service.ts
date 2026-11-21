import { AuthUserContext } from '@/auth';
import { courseAverage, gradeStatus, meanOf, scoreError } from '@/shared';
import { EnrollmentStatus, Prisma } from '@generated/prisma';
import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { enrolledIn } from '../courses/course-roster';
import { GradeAccessService, NOT_ENROLLED } from '../grades/grade-access.service';
import { pickCurrentPeriod } from '../home/home-period';
import { CLOCK, Clock, schoolLocalTime } from '../home/home-time';
import { PrismaService } from '../prisma.service';
import {
  Gradebook,
  GradebookBucket,
  GradebookCell,
  GradebookCourse,
  GradebookCourses,
  GradebookGroup,
  GradebookMetric,
  GradebookRow,
  GradebookSavedCell,
  GradebookSavedCells,
} from './entities/gradebook.entity';
import { SaveCellInput, SaveCellsInput } from './dto/save-cells.input';

export const SCHOOL_DENIED = 'La escuela no pertenece a tu organización';
export const PERIOD_INVALID = 'El periodo no pertenece al año escolar actual';
export const GROUP_INVALID = 'El grupo no tiene estudiantes en este curso';

// ASM-001-S03: saving cells (BR .2, .7, .10).
export const CELLS_INVALID = 'Hay valores inválidos; corrígelos antes de guardar';
export const CELLS_CONFLICT = 'Otra persona cambió estas notas; revisa antes de guardar';
export const METRIC_MISSING = 'Escala de notas no configurada';
export const COLUMN_INVALID = 'La calificación no pertenece a este curso y periodo';
export const COLUMN_PUBLISHED = 'Las calificaciones publicadas se corrigen desde su página';
export const CELL_REPEATED = 'Celda repetida';

/** `classGroupId` value that selects the roster's students without a class group. */
export const NO_GROUP = 'none';
const NO_GROUP_NAME = 'Sin grupo';

type Decimalish = { toNumber(): number } | number;
const num = (v: Decimalish) => (typeof v === 'number' ? v : v.toNumber());

interface RosterStudent {
  id: string;
  firstName: string;
  fatherName: string;
  classGroup: { id: string; name: string } | null;
  user: { color: string | null } | null;
}

/**
 * The teacher gradebook: the grid (ASM-001-S02) and saving draft cells (S03). Access: BR-ASM-001.1
 * (the course's teacher or an admin of its organization), checked by
 * `GradeAccessService.assertCanWriteCourse`.
 */
@Injectable()
export class GradebookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: GradeAccessService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** FR-ASM-001.1: the caller's courses in the school (admins: all of them), last graded first. */
  async courses(user: AuthUserContext | undefined, schoolId: string | undefined): Promise<GradebookCourses> {
    if (!user?.userId) throw new ForbiddenException('Not authenticated');
    const organizationId = user.organizationId;
    if (!organizationId) throw new ForbiddenException('Organization context required');
    if (!schoolId) throw new BadRequestException('schoolId is required');

    const school = await this.prisma.school.findFirst({ where: { id: schoolId, organizationId }, select: { id: true } });
    if (!school) throw new ForbiddenException(SCHOOL_DENIED);

    const where: Prisma.CourseWhereInput = { schoolId, organizationId };
    if (!this.access.isAdmin(user)) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId: user.userId, organizationId },
        select: { id: true },
      });
      if (!teacher) return { courses: [] };
      where.teacherId = teacher.id;
    }

    const courses = await this.prisma.course.findMany({ where, select: { id: true, name: true } });
    const lastGraded = await this.lastGradedAt(courses.map((c) => c.id));

    const list: GradebookCourse[] = courses.map((c) => ({
      id: c.id,
      name: c.name,
      lastGradedAt: lastGraded.get(c.id)?.toISOString() ?? null,
    }));
    list.sort((a, b) => {
      if (a.lastGradedAt !== b.lastGradedAt) {
        if (!a.lastGradedAt) return 1;
        if (!b.lastGradedAt) return -1;
        return a.lastGradedAt < b.lastGradedAt ? 1 : -1;
      }
      return a.name.localeCompare(b.name, 'es');
    });
    return { courses: list };
  }

  /** FR-ASM-001.2, .3, .5: one group's grid for one period, with averages, statuses and footer. */
  async gradebook(
    user: AuthUserContext | undefined,
    courseId: string,
    query: { periodId?: string; classGroupId?: string },
  ): Promise<Gradebook> {
    await this.access.assertCanWriteCourse(user, courseId);

    const course = await this.prisma.course.findUniqueOrThrow({
      where: { id: courseId },
      select: {
        id: true,
        name: true,
        organizationId: true,
        school: { select: { currentYear: true, timezone: true } },
        studyPlan: {
          select: {
            gradeMetric: { select: { minimum: true, maximum: true, minimumApproval: true, minimumExcellence: true } },
          },
        },
      },
    });

    const [periods, roster] = await Promise.all([
      this.prisma.period.findMany({
        where: { year: course.school.currentYear },
        select: { id: true, name: true, startDate: true, endDate: true },
        orderBy: { startDate: 'asc' },
      }),
      this.prisma.student.findMany({
        where: { organizationId: course.organizationId, enrollmentStatus: EnrollmentStatus.ACTIVE, ...enrolledIn(courseId) },
        select: {
          id: true,
          firstName: true,
          fatherName: true,
          classGroup: { select: { id: true, name: true } },
          user: { select: { color: true } },
        },
        orderBy: [{ firstName: 'asc' }, { fatherName: 'asc' }],
      }) as Promise<RosterStudent[]>,
    ]);

    // FR .3: the requested period of the current year, else the current one (BR-HOM-001.3).
    let periodId: string | null;
    if (query.periodId) {
      if (!periods.some((p) => p.id === query.periodId)) throw new BadRequestException(PERIOD_INVALID);
      periodId = query.periodId;
    } else {
      const today = schoolLocalTime(this.clock.now(), course.school.timezone).date;
      periodId = pickCurrentPeriod(periods, today)?.id ?? null;
    }

    // FR .2: the groups the roster spans; the requested one, else the first.
    const classGroups = groupsOf(roster);
    let selected: GradebookGroup | undefined;
    if (query.classGroupId) {
      const wanted = query.classGroupId === NO_GROUP ? null : query.classGroupId;
      selected = classGroups.find((g) => g.id === wanted);
      if (!selected) throw new BadRequestException(GROUP_INVALID);
    } else {
      selected = classGroups[0];
    }
    const students = selected ? roster.filter((s) => (s.classGroup?.id ?? null) === selected.id) : [];

    const metric = toMetric(course.studyPlan.gradeMetric);
    const base = {
      course: { id: course.id, name: course.name },
      metric,
      periods: periods.map((p) => ({
        id: p.id,
        name: p.name,
        startDate: p.startDate.toISOString(),
        endDate: p.endDate.toISOString(),
      })),
      periodId,
      classGroups,
      classGroupId: selected?.id ?? null,
    };
    if (!periodId || !students.length) {
      return { ...base, buckets: [], rows: students.map((s) => emptyRow(s)), footer: { columns: [], average: null }, includesDrafts: false };
    }

    const studentIds = students.map((s) => s.id);
    const [bucketRows, grades] = await Promise.all([
      this.prisma.gradeBucket.findMany({
        where: { courseId },
        select: { id: true, name: true, weight: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.grade.findMany({
        where: { courseId, periodId },
        select: {
          id: true,
          title: true,
          date: true,
          published: true,
          bucketId: true,
          studentGrades: {
            where: { studentId: { in: studentIds } },
            select: { id: true, studentId: true, score: true, updatedAt: true },
          },
        },
        orderBy: [{ date: 'asc' }, { title: 'asc' }],
      }),
    ]);

    // Buckets with at least one column this period, in creation order; their columns by date.
    const buckets: (GradebookBucket & { grades: typeof grades })[] = bucketRows
      .map((b) => {
        const own = grades.filter((g) => g.bucketId === b.id);
        return {
          id: b.id,
          name: b.name,
          weight: num(b.weight),
          columns: own.map((g) => ({ id: g.id, title: g.title, date: g.date.toISOString(), published: g.published })),
          grades: own,
        };
      })
      .filter((b) => b.columns.length > 0);
    const columns = buckets.flatMap((b) => b.grades.map((grade) => ({ grade, weight: b.weight })));

    const rows: GradebookRow[] = students.map((student) => {
      const cells = columns.map(({ grade }) => cellFor(grade.id, grade.studentGrades, student.id));
      // BR .4 over every column, drafts included (BR .6).
      const average = courseAverage(
        columns.map(({ grade, weight }, i) => ({ bucketId: grade.bucketId, weight, score: cells[i].score })),
      );
      return {
        student: studentOf(student),
        cells,
        average,
        status: gradeStatus(average, metric?.minimumApproval),
      };
    });

    const footer = {
      columns: columns.map(({ grade }, i) => ({ gradeId: grade.id, average: meanOf(rows.map((r) => r.cells[i].score)) })),
      average: meanOf(rows.map((r) => r.average)),
    };
    const includesDrafts = columns.some(({ grade }, i) => !grade.published && rows.some((r) => r.cells[i].score !== null));

    return {
      ...base,
      buckets: buckets.map((b) => ({ id: b.id, name: b.name, weight: b.weight, columns: b.columns })),
      rows,
      footer,
      includesDrafts,
    };
  }

  /**
   * FR-ASM-001.6: saves every changed cell of one period in one transaction (ASM-001-S03).
   * - 400 `{ message, cells: [{ gradeId, studentId, reason }] }` when any cell breaks BR .2 or does
   *   not belong to the course, the period, a draft column (published ones wait for S04) or the roster;
   * - 409 `{ message, cells: [saved values] }` when a row changed since the client loaded it (BR .7);
   * - missing rows are created (BR .10).
   */
  async saveCells(user: AuthUserContext | undefined, courseId: string, input: SaveCellsInput): Promise<GradebookSavedCells> {
    await this.access.assertCanWriteCourse(user, courseId);

    const course = await this.prisma.course.findUniqueOrThrow({
      where: { id: courseId },
      select: {
        organizationId: true,
        studyPlan: { select: { gradeMetric: { select: { minimum: true, maximum: true } } } },
      },
    });
    const metric = course.studyPlan.gradeMetric;
    if (!metric) throw new BadRequestException({ message: METRIC_MISSING, cells: [] });
    const scale = { minimum: num(metric.minimum), maximum: num(metric.maximum) };

    const gradeIds = [...new Set(input.cells.map((c) => c.gradeId))];
    const studentIds = [...new Set(input.cells.map((c) => c.studentId))];
    const [grades, roster] = await Promise.all([
      this.prisma.grade.findMany({
        where: { id: { in: gradeIds } },
        select: { id: true, courseId: true, periodId: true, published: true },
      }),
      this.prisma.student.findMany({
        where: {
          id: { in: studentIds },
          organizationId: course.organizationId,
          enrollmentStatus: EnrollmentStatus.ACTIVE,
          ...enrolledIn(courseId),
        },
        select: { id: true },
      }),
    ]);
    const gradeById = new Map(grades.map((g) => [g.id, g]));
    const onRoster = new Set(roster.map((s) => s.id));

    const seen = new Set<string>();
    const invalid: { gradeId: string; studentId: string; reason: string }[] = [];
    for (const cell of input.cells) {
      const key = cellKey(cell);
      const grade = gradeById.get(cell.gradeId);
      let reason: string | null = null;
      if (seen.has(key)) reason = CELL_REPEATED;
      else if (!grade || grade.courseId !== courseId || grade.periodId !== input.periodId) reason = COLUMN_INVALID;
      else if (grade.published) reason = COLUMN_PUBLISHED;
      else if (!onRoster.has(cell.studentId)) reason = NOT_ENROLLED;
      else if (cell.score !== null && cell.score !== undefined) reason = scoreError(cell.score, scale);
      seen.add(key);
      if (reason) invalid.push({ gradeId: cell.gradeId, studentId: cell.studentId, reason });
    }
    if (invalid.length) throw new BadRequestException({ message: CELLS_INVALID, cells: invalid });

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const pairs = { gradeId: { in: gradeIds }, studentId: { in: studentIds } };
          // Lock the rows this save touches, so the conflict check and the writes see the same state.
          await tx.$queryRaw`
            SELECT "id" FROM "student_grades"
            WHERE "gradeId" IN (${Prisma.join(gradeIds)}) AND "studentId" IN (${Prisma.join(studentIds)})
            FOR UPDATE`;
          const existing = await tx.studentGrade.findMany({
            where: pairs,
            select: { id: true, gradeId: true, studentId: true, score: true, updatedAt: true },
          });
          const byKey = new Map(existing.map((row) => [cellKey(row), row]));

          // BR .7: every cell must still be as the client loaded it.
          const conflicts = input.cells.filter((cell) => {
            const row = byKey.get(cellKey(cell));
            return (row?.updatedAt.toISOString() ?? null) !== (cell.updatedAt ?? null);
          });
          if (conflicts.length) {
            throw new ConflictException({
              message: CELLS_CONFLICT,
              cells: conflicts.map((cell) => savedCell(cell, byKey.get(cellKey(cell)))),
            });
          }

          const updates = input.cells.filter((cell) => byKey.has(cellKey(cell)));
          const creates = input.cells.filter((cell) => !byKey.has(cellKey(cell)));
          if (updates.length) {
            const values = updates.map(
              (cell) => Prisma.sql`(${byKey.get(cellKey(cell))?.id}, ${cell.score ?? null}::numeric)`,
            );
            await tx.$executeRaw`
              UPDATE "student_grades" AS sg
              SET "score" = v."score", "updatedAt" = now()
              FROM (VALUES ${Prisma.join(values)}) AS v("id", "score")
              WHERE sg."id" = v."id"`;
          }
          if (creates.length) {
            await tx.studentGrade.createMany({
              data: creates.map((cell) => ({ gradeId: cell.gradeId, studentId: cell.studentId, score: cell.score ?? null })),
            });
          }

          const saved = await tx.studentGrade.findMany({
            where: pairs,
            select: { id: true, gradeId: true, studentId: true, score: true, updatedAt: true },
          });
          const savedByKey = new Map(saved.map((row) => [cellKey(row), row]));
          return { cells: input.cells.map((cell) => savedCell(cell, savedByKey.get(cellKey(cell)))) };
        },
        { timeout: 15_000 },
      );
    } catch (error) {
      // A row created by someone else between our check and our insert (unique pair, BR .10).
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException({ message: CELLS_CONFLICT, cells: [] });
      }
      throw error;
    }
  }

  /** Last change to a column or a score, per course. */
  private async lastGradedAt(courseIds: string[]): Promise<Map<string, Date>> {
    const at = new Map<string, Date>();
    if (!courseIds.length) return at;
    const rows = await this.prisma.$queryRaw<{ courseId: string; at: Date | null }[]>(Prisma.sql`
      SELECT g."courseId", MAX(GREATEST(g."updatedAt", COALESCE(sg."updatedAt", g."updatedAt"))) AS "at"
      FROM "grades" g
      LEFT JOIN "student_grades" sg ON sg."gradeId" = g."id"
      WHERE g."courseId" IN (${Prisma.join(courseIds)})
      GROUP BY g."courseId"`);
    for (const row of rows) if (row.at) at.set(row.courseId, new Date(row.at));
    return at;
  }
}

function groupsOf(roster: RosterStudent[]): GradebookGroup[] {
  const groups = new Map<string | null, GradebookGroup>();
  for (const s of roster) {
    const id = s.classGroup?.id ?? null;
    const group = groups.get(id) ?? { id, name: s.classGroup?.name ?? NO_GROUP_NAME, studentCount: 0 };
    group.studentCount += 1;
    groups.set(id, group);
  }
  return [...groups.values()].sort((a, b) => {
    if (a.id === null) return 1;
    if (b.id === null) return -1;
    return a.name.localeCompare(b.name, 'es');
  });
}

/** The student's cell in a column; the most recently updated row wins until S03 makes the pair unique. */
function cellFor(
  gradeId: string,
  rows: { id: string; studentId: string; score: Decimalish | null; updatedAt: Date }[],
  studentId: string,
): GradebookCell {
  let found: (typeof rows)[number] | undefined;
  for (const row of rows) {
    if (row.studentId === studentId && (!found || row.updatedAt > found.updatedAt)) found = row;
  }
  return {
    gradeId,
    studentGradeId: found?.id ?? null,
    score: found?.score === null || found?.score === undefined ? null : num(found.score),
    updatedAt: found?.updatedAt.toISOString() ?? null,
  };
}

function studentOf(s: RosterStudent) {
  return {
    id: s.id,
    firstName: s.firstName,
    name: `${s.firstName} ${s.fatherName}`,
    initials: `${s.firstName.charAt(0)}${s.fatherName.charAt(0)}`,
    color: s.user?.color ?? null,
  };
}

function emptyRow(s: RosterStudent): GradebookRow {
  return { student: studentOf(s), cells: [], average: null, status: null };
}

function toMetric(
  m: { minimum: Decimalish; maximum: Decimalish; minimumApproval: Decimalish; minimumExcellence: Decimalish } | null,
): GradebookMetric | null {
  if (!m) return null;
  return {
    minimum: num(m.minimum),
    maximum: num(m.maximum),
    minimumApproval: num(m.minimumApproval),
    minimumExcellence: num(m.minimumExcellence),
  };
}

const cellKey = (cell: { gradeId: string; studentId: string }) => `${cell.gradeId}|${cell.studentId}`;

function savedCell(
  cell: Pick<SaveCellInput, 'gradeId' | 'studentId'>,
  row: { id: string; score: Decimalish | null; updatedAt: Date } | undefined,
): GradebookSavedCell {
  return {
    gradeId: cell.gradeId,
    studentId: cell.studentId,
    studentGradeId: row?.id ?? null,
    score: row?.score === null || row?.score === undefined ? null : num(row.score),
    updatedAt: row?.updatedAt.toISOString() ?? null,
  };
}
