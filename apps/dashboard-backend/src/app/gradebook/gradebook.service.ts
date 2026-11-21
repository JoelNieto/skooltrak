import { AuthUserContext } from '@/auth';
import { courseAverage, gradeStatus, meanOf, scoreError } from '@/shared';
import { EnrollmentStatus, Prisma } from '@generated/prisma';
import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { enrolledIn } from '../courses/course-roster';
import { GradeAccessService, NOT_ENROLLED } from '../grades/grade-access.service';
import { GradesService } from '../grades/grades.service';
import { alertInBackground } from '../grades/homeroom-alerts';
import {
  cellChanged,
  COMMENT_MAX,
  COMMENT_TOO_LONG,
  REASON_REQUIRED,
  recordRevisions,
  validReason,
} from '../grades/grade-revisions';
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
  GradebookAssignments,
  GradebookHistory,
  GradebookPublished,
  GradebookSavedCell,
  GradebookSavedCells,
} from './entities/gradebook.entity';
import { SaveCellInput, SaveCellsInput } from './dto/save-cells.input';
import { gradebookCsv, gradebookCsvName } from './gradebook-csv';

export const SCHOOL_DENIED = 'La escuela no pertenece a tu organización';
export const PERIOD_INVALID = 'El periodo no pertenece al año escolar actual';
export const GROUP_INVALID = 'El grupo no tiene estudiantes en este curso';

// ASM-001-S03: saving cells (BR .2, .7, .10).
export const CELLS_INVALID = 'Hay valores inválidos; corrígelos antes de guardar';
export const CELLS_CONFLICT = 'Otra persona cambió estas notas; revisa antes de guardar';
export const METRIC_MISSING = 'Escala de notas no configurada';
export const COLUMN_INVALID = 'La calificación no pertenece a este curso y periodo';
export const CELL_REPEATED = 'Celda repetida';
export const EXCUSED_WITH_SCORE = 'Una nota exenta no lleva calificación';

/** `classGroupId` value that selects the roster's students without a class group. */
export const NO_GROUP = 'none';
const NO_GROUP_NAME = 'Sin grupo';

type Decimalish = { toNumber(): number } | number;
const num = (v: Decimalish) => (typeof v === 'number' ? v : v.toNumber());

interface RosterStudent {
  id: string;
  firstName: string;
  fatherName: string;
  documentId: string;
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
    private readonly grades: GradesService,
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
          documentId: true,
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
          publishedAt: true,
          assignment: { select: { id: true, title: true } },
          bucketId: true,
          studentGrades: {
            where: { studentId: { in: studentIds } },
            select: { id: true, studentId: true, score: true, excused: true, comments: true, updatedAt: true },
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
          columns: own.map((g) => ({
            id: g.id,
            title: g.title,
            date: g.date.toISOString(),
            published: g.published,
            publishedAt: g.publishedAt?.toISOString() ?? null,
            assignment: g.assignment,
          })),
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
   * - 400 `{ message, cells: [{ gradeId, studentId, reason }] }` when any cell breaks BR .2 or .14,
   *   or does not belong to the course, the period or the roster;
   * - 409 `{ message, cells: [saved values] }` when a row changed since the client loaded it (BR .7);
   * - 400 `Indica el motivo del cambio` when a published score changes without a valid reason, given
   *   per cell or for the whole save; each such change writes a revision (BR .8, S04);
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
      else if (!onRoster.has(cell.studentId)) reason = NOT_ENROLLED;
      else if (cell.excused && cell.score !== null && cell.score !== undefined) reason = EXCUSED_WITH_SCORE;
      else if (cell.score !== null && cell.score !== undefined) reason = scoreError(cell.score, scale);
      if (!reason && (cell.comment?.length ?? 0) > COMMENT_MAX) reason = COMMENT_TOO_LONG;
      seen.add(key);
      if (reason) invalid.push({ gradeId: cell.gradeId, studentId: cell.studentId, reason });
    }
    if (invalid.length) throw new BadRequestException({ message: CELLS_INVALID, cells: invalid });

    try {
      const saved = await this.prisma.$transaction(
        async (tx) => {
          const pairs = { gradeId: { in: gradeIds }, studentId: { in: studentIds } };
          // Lock the rows this save touches, so the conflict check and the writes see the same state.
          await tx.$queryRaw`
            SELECT "id" FROM "student_grades"
            WHERE "gradeId" IN (${Prisma.join(gradeIds)}) AND "studentId" IN (${Prisma.join(studentIds)})
            FOR UPDATE`;
          const existing = await tx.studentGrade.findMany({
            where: pairs,
            select: { id: true, gradeId: true, studentId: true, score: true, excused: true, comments: true, updatedAt: true },
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

          // BR .8: a changed published score needs a reason, for this cell or for the whole save.
          const corrections = input.cells
            .filter((cell) => gradeById.get(cell.gradeId)?.published && cellChanged(byKey.get(cellKey(cell)), cell))
            .map((cell) => ({ cell, reason: validReason(cell.reason ?? input.reason) }));
          const unexplained = corrections.filter((c) => !c.reason);
          if (unexplained.length) {
            throw new BadRequestException({
              message: REASON_REQUIRED,
              cells: unexplained.map(({ cell }) => ({ gradeId: cell.gradeId, studentId: cell.studentId, reason: REASON_REQUIRED })),
            });
          }

          const updates = input.cells.filter((cell) => byKey.has(cellKey(cell)));
          const creates = input.cells.filter((cell) => !byKey.has(cellKey(cell)));
          if (updates.length) {
            // `setComment` false keeps the stored comment (the cell's comment was not part of the change).
            const values = updates.map(
              (cell) =>
                Prisma.sql`(${byKey.get(cellKey(cell))?.id}, ${cell.score ?? null}::numeric, ${cell.excused ?? false}::boolean, ${cell.comment !== undefined}::boolean, ${cell.comment || null}::text)`,
            );
            await tx.$executeRaw`
              UPDATE "student_grades" AS sg
              SET "score" = v."score",
                  "excused" = v."excused",
                  "comments" = CASE WHEN v."setComment" THEN v."comments" ELSE sg."comments" END,
                  "updatedAt" = now()
              FROM (VALUES ${Prisma.join(values)}) AS v("id", "score", "excused", "setComment", "comments")
              WHERE sg."id" = v."id"`;
          }
          if (creates.length) {
            await tx.studentGrade.createMany({
              data: creates.map((cell) => ({
                gradeId: cell.gradeId,
                studentId: cell.studentId,
                score: cell.score ?? null,
                excused: cell.excused ?? false,
                comments: cell.comment || null,
              })),
            });
          }

          const saved = await tx.studentGrade.findMany({
            where: pairs,
            select: { id: true, gradeId: true, studentId: true, score: true, excused: true, comments: true, updatedAt: true },
          });
          const savedByKey = new Map(saved.map((row) => [cellKey(row), row]));
          await recordRevisions(
            tx,
            corrections.map(({ cell, reason }) => ({
              studentGradeId: savedByKey.get(cellKey(cell))?.id as string,
              previousScore: byKey.get(cellKey(cell))?.score ?? null,
              score: cell.score ?? null,
              excused: cell.excused ?? false,
              reason: reason as string,
            })),
            user?.userId ?? null,
          );
          return { cells: input.cells.map((cell) => savedCell(cell, savedByKey.get(cellKey(cell)))) };
        },
        { timeout: 15_000 },
      );
      // BR-ASM-001.12: saved published cells below the pass mark alert the homeroom teacher.
      const publishedCells = new Map<string, string[]>();
      for (const cell of input.cells) {
        if (!gradeById.get(cell.gradeId)?.published) continue;
        publishedCells.set(cell.gradeId, [...(publishedCells.get(cell.gradeId) ?? []), cell.studentId]);
      }
      for (const [gradeId, ids] of publishedCells) {
        alertInBackground(this.prisma, gradeId, { studentIds: ids, actorUserId: user?.userId ?? null });
      }
      return saved;
    } catch (error) {
      // A row created by someone else between our check and our insert (unique pair, BR .10).
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException({ message: CELLS_CONFLICT, cells: [] });
      }
      throw error;
    }
  }

  /**
   * FR-ASM-001.7: publishes the course's draft columns among `gradeIds`, stamping when and by whom
   * (BR .9), and sends the existing published-grade notifications. Already published columns are left
   * as they were; a column of another course is refused with 400.
   */
  async publish(user: AuthUserContext | undefined, courseId: string, gradeIds: string[]): Promise<GradebookPublished> {
    await this.access.assertCanWriteCourse(user, courseId);
    const ids = [...new Set(gradeIds)];
    const columns = await this.prisma.grade.findMany({
      where: { id: { in: ids } },
      select: { id: true, courseId: true, published: true },
    });
    const foreign = ids.filter((id) => !columns.some((c) => c.id === id && c.courseId === courseId));
    if (foreign.length) throw new BadRequestException(COLUMN_INVALID);

    const drafts = columns.filter((c) => !c.published).map((c) => c.id);
    if (!drafts.length) return { gradeIds: [] };
    await this.prisma.grade.updateMany({
      where: { id: { in: drafts }, published: false },
      data: { published: true, publishedAt: new Date(), publishedById: user?.userId ?? null },
    });
    // Emails and homeroom alerts go out after the response: the teacher doesn't wait on them.
    void this.notify(drafts);
    for (const id of drafts) alertInBackground(this.prisma, id, { actorUserId: user?.userId ?? null });
    return { gradeIds: drafts };
  }

  private async notify(gradeIds: string[]): Promise<void> {
    for (const id of gradeIds) {
      try {
        await this.grades.notifyPublished(id);
      } catch (error) {
        // Ids only: no names or scores in logs (FRD §8).
        console.error(`[GradebookService] published-grade notifications failed for grade ${id}`, error);
      }
    }
  }

  /** FR-ASM-001.13: the CSV of one view, as saved, with a file name naming the course, period and group. */
  async exportCsv(
    user: AuthUserContext | undefined,
    courseId: string,
    query: { periodId?: string; classGroupId?: string },
  ): Promise<{ filename: string; csv: string }> {
    const book = await this.gradebook(user, courseId, query);
    const period = book.periods.find((p) => p.id === book.periodId)?.name;
    const group = book.classGroups.find((g) => g.id === book.classGroupId)?.name;
    return { filename: gradebookCsvName([book.course.name, period, group]), csv: gradebookCsv(book) };
  }

  /** FR-ASM-001.11: the course's assignments, newest first, with the column linked to each. */
  async assignments(user: AuthUserContext | undefined, courseId: string): Promise<GradebookAssignments> {
    await this.access.assertCanWriteCourse(user, courseId);
    const assignments = await this.prisma.assignment.findMany({
      where: { courseId },
      select: { id: true, title: true, date: true, grade: { select: { id: true } } },
      orderBy: { date: 'desc' },
    });
    return {
      assignments: assignments.map((a) => ({
        id: a.id,
        title: a.title,
        date: a.date.toISOString(),
        gradeId: a.grade?.id ?? null,
      })),
    };
  }

  /** FR-ASM-001.8: a cell's revisions, newest first (BR .8). Staff of the course only. */
  async history(user: AuthUserContext | undefined, studentGradeId: string): Promise<GradebookHistory> {
    const ref = await this.access.studentGradeRef(studentGradeId);
    await this.access.assertCanWriteCourse(user, ref.grade.courseId);
    const revisions = await this.prisma.studentGradeRevision.findMany({
      where: { studentGradeId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        previousScore: true,
        score: true,
        excused: true,
        reason: true,
        createdAt: true,
        changedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    return {
      revisions: revisions.map((r) => ({
        id: r.id,
        previousScore: r.previousScore === null ? null : num(r.previousScore),
        score: r.score === null ? null : num(r.score),
        excused: r.excused,
        reason: r.reason,
        changedBy: r.changedBy
          ? { id: r.changedBy.id, name: [r.changedBy.firstName, r.changedBy.lastName].filter(Boolean).join(' ') }
          : null,
        createdAt: r.createdAt.toISOString(),
      })),
    };
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
  rows: { id: string; studentId: string; score: Decimalish | null; excused: boolean; comments: string | null; updatedAt: Date }[],
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
    excused: found?.excused ?? false,
    comment: found?.comments ?? null,
    updatedAt: found?.updatedAt.toISOString() ?? null,
  };
}

function studentOf(s: RosterStudent) {
  return {
    id: s.id,
    firstName: s.firstName,
    name: `${s.firstName} ${s.fatherName}`,
    documentId: s.documentId,
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
  row: { id: string; score: Decimalish | null; excused?: boolean; comments?: string | null; updatedAt: Date } | undefined,
): GradebookSavedCell {
  return {
    gradeId: cell.gradeId,
    studentId: cell.studentId,
    studentGradeId: row?.id ?? null,
    score: row?.score === null || row?.score === undefined ? null : num(row.score),
    excused: row?.excused ?? false,
    comment: row?.comments ?? null,
    updatedAt: row?.updatedAt.toISOString() ?? null,
  };
}
