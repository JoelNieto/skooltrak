import { FetchDataQueryDto, PaginatedResponseDto } from '@/api-contracts';
import { suggestedPlanName, suggestedPlanShortName } from '@/shared';
import { Prisma } from '@generated/prisma';
import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { uniqueCourseCode } from '../courses/course-code';
import { enrollPlanStudents } from '../courses/course-roster';
import { DEFAULT_BUCKETS } from '../courses/default-buckets.constants';
import { PrismaService } from '../prisma.service';
import { BulkCreateStudyPlansInput } from './dto/bulk-create-study-plans.input';
import { CopyCoursesInput } from './dto/copy-courses.input';
import { CreateStudyPlanInput } from './dto/create-study-plan.input';
import { DuplicateStudyPlanInput } from './dto/duplicate-study-plan.input';
import { PlanSettingsInput } from './dto/plan-settings.input';
import { UpdateStudyPlanInput } from './dto/update-study-plan.input';
import { costRows, settingsScalars } from './plan-settings-writes';

export const PLAN_NAME_TAKEN = 'Ya existe un plan de estudio con ese nombre en la escuela';
export const COPY_SAME_PLAN = 'Elige un plan de origen distinto';
export const COPY_OTHER_SCHOOL = 'El plan de origen debe ser de la misma escuela';
export const BULK_RANGE_INVALID = 'El rango de grados no es válido (máximo 20 planes a la vez)';
const MAX_BULK_PLANS = 20;

/** A plan with its overrides and its degree's defaults, for the forms to show what it inherits. */
const PLAN_INCLUDE = {
  degree: { include: { gradeMetric: true, enrollmentCosts: { orderBy: { order: 'asc' } } } },
  school: true,
  gradeMetric: true,
  enrollmentCosts: { orderBy: { order: 'asc' } },
} as const satisfies Prisma.StudyPlanInclude;

@Injectable()
export class StudyPlansService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  /** Creates the plan with its settings overrides in one write. */
  create(input: CreateStudyPlanInput) {
    const costs = input.enrollmentCosts ? costRows(input.enrollmentCosts) : [];
    return this.uniqueName(() =>
      this.prisma.studyPlan.create({
        data: {
          name: input.name.trim(),
          shortName: input.shortName.trim(),
          level: input.level,
          description: input.description ?? '',
          degreeId: input.degreeId,
          schoolId: input.schoolId,
          ...settingsScalars(input),
          ...(costs.length ? { enrollmentCosts: { createMany: { data: costs } } } : {}),
        },
        include: PLAN_INCLUDE,
      }),
    );
  }

  /**
   * One plan per grade of the range, named after the degree ("3° Primaria"). Grades the degree
   * already has, and names already taken in the school, are skipped. The plans inherit every
   * setting from the degree.
   */
  async bulkCreate(input: BulkCreateStudyPlansInput) {
    const { schoolId, degreeId, fromLevel, toLevel } = input;
    if (toLevel < fromLevel || toLevel - fromLevel + 1 > MAX_BULK_PLANS) {
      throw new BadRequestException(BULK_RANGE_INVALID);
    }
    const degree = await this.prisma.degree.findUniqueOrThrow({ where: { id: degreeId } });
    const existing = await this.prisma.studyPlan.findMany({
      where: { schoolId },
      select: { name: true, level: true, degreeId: true },
    });
    const takenNames = new Set(existing.map((p) => p.name.toLowerCase()));
    const takenLevels = new Set(existing.filter((p) => p.degreeId === degreeId).map((p) => p.level));

    const data: Prisma.StudyPlanCreateManyInput[] = [];
    const skipped: number[] = [];
    for (let level = fromLevel; level <= toLevel; level++) {
      const name = suggestedPlanName(level, degree.name);
      if (takenLevels.has(level) || takenNames.has(name.toLowerCase())) {
        skipped.push(level);
        continue;
      }
      data.push({
        name,
        shortName: suggestedPlanShortName(level, degree.shortName),
        level,
        description: '',
        degreeId,
        schoolId,
      });
    }
    const created = data.length
      ? await this.uniqueName(() =>
          this.prisma.studyPlan.createManyAndReturn({ data, select: { id: true, name: true, level: true } }),
        )
      : [];
    return { created, skipped };
  }

  /**
   * A copy of the plan: its overrides, enrollment costs and, unless `copyCourses` is false, its
   * courses (subject, color, icon and grade categories, else the default ones; no teacher, no
   * students). One transaction.
   */
  async duplicate(sourceId: string, input: DuplicateStudyPlanInput) {
    const source = await this.prisma.studyPlan.findUnique({
      where: { id: sourceId },
      include: {
        enrollmentCosts: { orderBy: { order: 'asc' } },
        courses: {
          include: { subject: true, gradeBuckets: { orderBy: { createdAt: 'asc' } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!source) throw new NotFoundException('Plan de estudio no encontrado');

    return this.uniqueName(() =>
      this.prisma.$transaction(async (tx) => {
        const plan = await tx.studyPlan.create({
          data: {
            name: input.name.trim(),
            shortName: input.shortName.trim(),
            level: input.level,
            description: source.description,
            degreeId: input.degreeId ?? source.degreeId,
            schoolId: source.schoolId,
            gradeMetricId: source.gradeMetricId,
            monthlyTuitionAmount: source.monthlyTuitionAmount,
            tuitionStartMonth: source.tuitionStartMonth,
            tuitionEndMonth: source.tuitionEndMonth,
            enrollmentCosts: {
              createMany: {
                data: source.enrollmentCosts.map((c) => ({ name: c.name, amount: c.amount, order: c.order })),
              },
            },
          },
        });

        const courses = input.copyCourses !== false ? await copyCoursesInto(tx, source.courses, plan) : [];
        return { ...plan, copiedCourses: courses.length };
      }),
    );
  }

  /**
   * Copies courses of another plan of the same school into an existing plan: the given subjects,
   * or all of them. Subjects the target already has are skipped. The copies take the subject,
   * color, icon and grade categories (not the teacher), and the target plan's students are
   * enrolled in them (ACA-001 BR .15). One transaction.
   */
  async copyCourses(targetId: string, input: CopyCoursesInput) {
    if (input.sourceStudyPlanId === targetId) throw new BadRequestException(COPY_SAME_PLAN);
    const [target, source] = await Promise.all([
      this.prisma.studyPlan.findUnique({
        where: { id: targetId },
        select: { id: true, name: true, shortName: true, schoolId: true, courses: { select: { subjectId: true } } },
      }),
      this.prisma.studyPlan.findUnique({
        where: { id: input.sourceStudyPlanId },
        select: {
          schoolId: true,
          courses: {
            where: input.subjectIds?.length ? { subjectId: { in: input.subjectIds } } : {},
            include: { subject: true, gradeBuckets: { orderBy: { createdAt: 'asc' } } },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
    ]);
    if (!target || !source) throw new NotFoundException('Plan de estudio no encontrado');
    if (source.schoolId !== target.schoolId) throw new BadRequestException(COPY_OTHER_SCHOOL);

    const existing = new Set(target.courses.map((c) => c.subjectId));
    const toCopy = source.courses.filter((c) => !existing.has(c.subjectId));
    const skipped = source.courses.filter((c) => existing.has(c.subjectId)).map((c) => c.subject.name);

    const copied = await this.prisma.$transaction(async (tx) => {
      const created = await copyCoursesInto(tx, toCopy, target);
      for (const course of created) await enrollPlanStudents(tx, course);
      return created;
    });
    return { copied: copied.map((c) => ({ id: c.id, name: c.name })), skipped };
  }

  findAll() {
    return this.prisma.studyPlan.findMany({ include: PLAN_INCLUDE });
  }

  async findMany(fetchDataInput: FetchDataQueryDto) {
    const { skip, page, pageSize, schoolId, search, degreeId, orderBy, orderDirection } = fetchDataInput;

    const orderField = orderBy ?? 'createdAt';
    const orderDir = orderDirection ?? 'asc';

    let where: Prisma.StudyPlanWhereInput = {
      schoolId,
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { shortName: { contains: search, mode: 'insensitive' } },
      ],
    };

    if (degreeId) {
      where = { ...where, degreeId };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.studyPlan.findMany({
        where,
        skip,
        take: pageSize,
        include: PLAN_INCLUDE,
        orderBy: { [orderField]: orderDir },
      }),
      this.prisma.studyPlan.count({ where }),
    ]);

    return new PaginatedResponseDto(data, total, page, pageSize);
  }

  findAllBySchoolId(schoolId: string, degreeId?: string) {
    if (!schoolId) return [];
    return this.prisma.studyPlan.findMany({
      where: { schoolId, ...(degreeId ? { degreeId } : {}) },
      include: PLAN_INCLUDE,
      orderBy: { level: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.studyPlan.findUnique({ where: { id }, include: PLAN_INCLUDE });
  }

  /** Updates the plan and its settings overrides in one transaction. */
  update(id: string, input: UpdateStudyPlanInput) {
    return this.uniqueName(() =>
      this.prisma.$transaction(async (tx) => {
        await this.replaceCosts(tx, id, input);
        return tx.studyPlan.update({
          where: { id },
          data: {
            ...(input.name !== undefined ? { name: input.name.trim() } : {}),
            ...(input.shortName !== undefined ? { shortName: input.shortName.trim() } : {}),
            ...(input.level !== undefined ? { level: input.level } : {}),
            ...(input.description !== undefined ? { description: input.description } : {}),
            ...(input.degreeId !== undefined ? { degreeId: input.degreeId } : {}),
            ...(input.schoolId !== undefined ? { schoolId: input.schoolId } : {}),
            ...settingsScalars(input),
          },
          include: PLAN_INCLUDE,
        });
      }),
    );
  }

  remove(id: string) {
    return this.prisma.studyPlan.delete({ where: { id } });
  }

  /** The financial overrides alone (POST /financial/study-plan-config). */
  updateFinancialConfig(input: PlanSettingsInput & { studyPlanId: string }) {
    const { studyPlanId, monthlyTuitionAmount, tuitionStartMonth, tuitionEndMonth, enrollmentCosts } = input;
    return this.update(studyPlanId, {
      id: studyPlanId,
      monthlyTuitionAmount,
      tuitionStartMonth,
      tuitionEndMonth,
      enrollmentCosts,
    });
  }

  /** Replaces the plan's enrollment costs when the input sets them; an empty list inherits. */
  private async replaceCosts(tx: Prisma.TransactionClient, studyPlanId: string, input: PlanSettingsInput) {
    if (input.enrollmentCosts === undefined) return;
    await tx.studyPlanEnrollmentCost.deleteMany({ where: { studyPlanId } });
    const rows = costRows(input.enrollmentCosts);
    if (rows.length) {
      await tx.studyPlanEnrollmentCost.createMany({ data: rows.map((r) => ({ ...r, studyPlanId })) });
    }
  }

  /** Turns the unique (school, name) violation into a 409 the form can show. */
  private async uniqueName<T>(write: () => Promise<T>): Promise<T> {
    try {
      return await write();
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(PLAN_NAME_TAKEN);
      }
      throw error;
    }
  }
}

type SourceCourse = Prisma.CourseGetPayload<{ include: { subject: true; gradeBuckets: true } }>;

/**
 * Creates a copy of each course in the plan, named after it ("Matemáticas - 3° Primaria"): its
 * subject, color, icon and grade categories (the default ones when it has none). No teacher.
 */
async function copyCoursesInto(
  tx: Prisma.TransactionClient,
  courses: SourceCourse[],
  plan: { id: string; name: string; shortName: string; schoolId: string },
) {
  const created = [];
  for (const course of courses) {
    created.push(
      await tx.course.create({
        data: {
          name: `${course.subject.name} - ${plan.name}`,
          shortName: `${course.subject.code} - ${plan.shortName}`,
          code: await uniqueCourseCode(tx, plan.schoolId, course.subject.name),
          color: course.color,
          icon: course.icon,
          organizationId: course.organizationId,
          schoolId: plan.schoolId,
          subjectId: course.subjectId,
          studyPlanId: plan.id,
          gradeBuckets: {
            createMany: {
              data: course.gradeBuckets.length
                ? course.gradeBuckets.map((b) => ({ name: b.name, weight: b.weight }))
                : DEFAULT_BUCKETS.map((b) => ({ name: b.name, weight: b.weighting })),
            },
          },
        },
      }),
    );
  }
  return created;
}
