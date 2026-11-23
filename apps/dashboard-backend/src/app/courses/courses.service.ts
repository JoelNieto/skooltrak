import { Prisma } from '@generated/prisma';

import { FetchDataQueryDto, PaginatedResponseDto } from '@/api-contracts';
import type { AuthUserContext } from '@/auth';
import { resolveCourseColor } from '@/shared';
import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../prisma.service';
import { enrolledCourses, enrollPlanStudents, resyncCoursePlan } from './course-roster';
import { DEFAULT_BUCKETS } from './default-buckets.constants';

export const SCHOOL_DENIED = 'La escuela no pertenece a tu organización';
import { CreateCourseInput } from './dto/create-course.input';
import { UpdateCourseInput } from './dto/update-course.input';

export const COURSE_DENIED = 'No tienes acceso a este curso';
export const STUDY_PLAN_NOT_FOUND = 'El plan de estudio seleccionado no existe';
export const SUBJECT_NOT_FOUND = 'La asignatura seleccionada no existe';
export const TEACHER_NOT_FOUND = 'El docente seleccionado no existe';

/**
 * Adds the color to show (ACA-001 BR .11): the course's own, or one derived from its id.
 * `colorIsDefault` tells the course form whether a color was actually chosen.
 */
export function withResolvedColor<T extends { id: string; color?: string | null }>(course: T) {
  return { ...course, color: resolveCourseColor(course.id, course.color), colorIsDefault: !course.color };
}

/**
 * Every course read and write is limited to the caller's organization. A course, study plan,
 * subject or teacher of another organization is treated as if it did not exist.
 */
@Injectable({ scope: Scope.REQUEST })
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  /** The caller's organization; refuses callers without one. */
  /** BR-ACA-001.4: a `schoolId` given to the course lists must belong to the caller's organization. */
  private async assertSchoolInOrganization(schoolId: string | undefined, organizationId: string): Promise<void> {
    if (!schoolId) return;
    const found = await this.prisma.school.count({ where: { id: schoolId, organizationId } });
    if (!found) throw new ForbiddenException(SCHOOL_DENIED);
  }

  private organizationId(): string {
    const user = this.request.user as AuthUserContext | undefined;
    if (!user?.organizationId) throw new ForbiddenException(COURSE_DENIED);
    return user.organizationId;
  }

  /** Throws 403 unless the course exists in the caller's organization. */
  private async assertInOrganization(id: string, organizationId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id, organizationId },
      select: { id: true, studyPlanId: true },
    });
    if (!course) throw new ForbiddenException(COURSE_DENIED);
    return course;
  }

  /** Loads a study plan of the caller's organization, or throws 409 as if it did not exist. */
  private async studyPlanInOrganization(studyPlanId: string | undefined, organizationId: string) {
    const studyPlan = studyPlanId
      ? await this.prisma.studyPlan.findFirst({
          where: { id: studyPlanId, school: { organizationId } },
          include: { school: true },
        })
      : null;
    if (!studyPlan) throw new ConflictException(STUDY_PLAN_NOT_FOUND);
    return studyPlan;
  }

  private async subjectInOrganization(subjectId: string | undefined, organizationId: string) {
    const subject = subjectId
      ? await this.prisma.subject.findFirst({ where: { id: subjectId, organizationId } })
      : null;
    if (!subject) throw new BadRequestException(SUBJECT_NOT_FOUND);
    return subject;
  }

  private async assertTeacherInOrganization(teacherId: string, organizationId: string): Promise<void> {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: teacherId, organizationId },
      select: { id: true },
    });
    if (!teacher) throw new BadRequestException(TEACHER_NOT_FOUND);
  }

  /**
   * Generates a unique course code starting with 3 letters.
   * If the code already exists, it adds more letters until unique.
   */
  private async generateUniqueCode(schoolId: string, baseName: string): Promise<string> {
    // Remove non-alphabetic characters and convert to uppercase
    const cleanName = baseName.replace(/[^a-zA-Z]/g, '').toUpperCase();

    // Start with 3 letters minimum
    for (let length = 3; length <= cleanName.length; length++) {
      const code = cleanName.substring(0, length);

      const existing = await this.prisma.course.findUnique({
        where: {
          schoolId_code: { schoolId, code },
        },
      });

      if (!existing) {
        return code;
      }
    }

    // If all substrings are taken, append a number
    let counter = 1;
    while (true) {
      const code = `${cleanName.substring(0, 3)}${counter}`;
      const existing = await this.prisma.course.findUnique({
        where: {
          schoolId_code: { schoolId, code },
        },
      });

      if (!existing) {
        return code;
      }
      counter++;
    }
  }

  async create(createCourseInput: CreateCourseInput) {
    const callerOrganizationId = this.organizationId();
    const studyPlan = await this.studyPlanInOrganization(createCourseInput.studyPlanId, callerOrganizationId);
    const subject = await this.subjectInOrganization(createCourseInput.subjectId, callerOrganizationId);
    if (createCourseInput.teacherId) {
      await this.assertTeacherInOrganization(createCourseInput.teacherId, callerOrganizationId);
    }

    // Derive school/org from the chosen study plan to avoid saving the
    // course under the wrong school when the client context is stale.
    const schoolId = studyPlan.schoolId;
    const organizationId = studyPlan.school.organizationId;

    // Use provided code or generate a unique one from subject name
    const code = createCourseInput.code
      ? createCourseInput.code
      : await this.generateUniqueCode(schoolId, subject.name);

    let course;
    try {
      course = await this.prisma.course.create({
        data: {
          ...createCourseInput,
          organizationId,
          schoolId,
          shortName: createCourseInput.shortName
            ? `${createCourseInput.shortName}`
            : `${subject?.code} - ${studyPlan?.shortName}`,
          name: createCourseInput.name ? `${createCourseInput.name}` : `${subject?.name} - ${studyPlan?.name}`,
          code,
          gradeBuckets: {
            createMany: {
              data: DEFAULT_BUCKETS.map((bucket) => ({
                name: bucket.name,
                weight: bucket.weighting,
              })),
            },
          },
        },
        include: { school: true, subject: true, studyPlan: true },
      });
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'P2002') {
        throw new ConflictException(
          `Ya existe un curso con la asignatura "${subject?.name}" en el plan "${studyPlan?.name}"`,
        );
      }
      throw error;
    }

    // Enroll the study plan's students in the new course (ACA-001 BR .15).
    await enrollPlanStudents(this.prisma, course);

    return this.prisma.course.findUnique({
      where: { id: course.id },
      include: {
        school: true,
        subject: true,
        studyPlan: { include: { gradeMetric: true } },
      },
    });
  }

  async replicate(targetStudyPlanId: string, sourceStudyPlanId: string) {
    const [courses, targetStudyPlan] = await Promise.all([
      this.prisma.course.findMany({
        where: { studyPlanId: sourceStudyPlanId },
        include: { subject: true },
      }),
      this.prisma.studyPlan.findUnique({
        where: { id: targetStudyPlanId },
      }),
    ]);

    if (!targetStudyPlan) {
      throw new ConflictException('Target study plan not found');
    }

    const createdCourses = [];
    for (const course of courses) {
      const code = await this.generateUniqueCode(course.schoolId, course.subject.name);

      const newCourse = await this.prisma.course.create({
        data: {
          name: `${course.subject.name} - ${targetStudyPlan.name}`,
          code,
          shortName: `${course.subject.code} - ${targetStudyPlan.shortName}`,
          organizationId: course.organizationId,
          schoolId: course.schoolId,
          subjectId: course.subjectId,
          studyPlanId: targetStudyPlanId,
        },
      });
      await enrollPlanStudents(this.prisma, newCourse);
      createdCourses.push(newCourse);
    }

    return { count: createdCourses.length };
  }

  async findAll(fetchDataInput: FetchDataQueryDto) {
    const organizationId = this.organizationId();
    await this.assertSchoolInOrganization(fetchDataInput.schoolId, organizationId);
    const req = this.request;
    const { role, userId } = req.user as any;
    const { skip, pageSize, page, schoolId, search, studyPlanId, orderBy, orderDirection } = fetchDataInput;
    const orderField = orderBy ?? 'createdAt';
    const orderDir = orderDirection ?? 'asc';
    let where: Prisma.CourseWhereInput = {
      organizationId,
      schoolId,
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { shortName: { contains: search, mode: 'insensitive' } },
      ],
    };

    if (role === 'STUDENT') {
      where = {
        ...where,
        ...enrolledCourses({ userId }),
      };
    }

    if (role === 'TEACHER') {
      where = { ...where, teacher: { user: { id: userId } } };
    }

    if (studyPlanId) {
      where = { ...where, studyPlanId };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          school: {
            select: { id: true, name: true },
          },
          // FR-ACA-001.9: staff cards show the subject's area chip (BR .14).
          subject: { select: { id: true, name: true, icon: true, area: true } },
          studyPlan: { select: { id: true, name: true, shortName: true } },
          teacher: {
            select: {
              id: true,
              firstName: true,
              fatherName: true,
              middleName: true,
              motherName: true,
              user: { select: { id: true, color: true, image: true, email: true } },
            },
          },
        },
        orderBy: {
          [orderField]: orderDir,
        },
      }),
      this.prisma.course.count({ where }),
    ]);
    return new PaginatedResponseDto(data.map(withResolvedColor), total, page, pageSize);
  }

  async count(fetchDataInput: FetchDataQueryDto) {
    const organizationId = this.organizationId();
    await this.assertSchoolInOrganization(fetchDataInput.schoolId, organizationId);
    const req = this.request;
    const { role, userId } = req.user as any;
    const { schoolId, search, studyPlanId } = fetchDataInput;
    let where: Prisma.CourseWhereInput = {
      organizationId,
      schoolId,
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { shortName: { contains: search, mode: 'insensitive' } },
      ],
    };

    if (role === 'STUDENT') {
      where = {
        ...where,
        ...enrolledCourses({ userId }),
      };
    }

    if (role === 'TEACHER') {
      where = { ...where, teacher: { user: { id: userId } } };
    }

    if (studyPlanId) {
      where = { ...where, studyPlanId };
    }
    return this.prisma.course.count({
      where,
    });
  }

  findManyBySchoolId(schoolId: string) {
    return this.prisma.course.findMany({
      where: { schoolId, organizationId: this.organizationId() },
      include: {
        school: true,
        subject: true,
        studyPlan: { include: { degree: true } },
      },
    });
  }

  findManyBySubjectId(subjectId: string) {
    return this.prisma.course.findMany({
      where: { subjectId, organizationId: this.organizationId() },
      include: {
        school: true,
        subject: true,
        studyPlan: { include: { degree: true } },
      },
    });
  }

  findManyByStudyPlanId(studyPlanId: string) {
    return this.prisma.course.findMany({
      where: { studyPlanId, organizationId: this.organizationId() },
      include: {
        school: true,
        subject: true,
        studyPlan: { include: { degree: true } },
      },
    });
  }

  // Grades are not included: they are read through the grade endpoints, which apply
  // GradeAccessService (published-only and per-student rules).
  async findOne(id: string) {
    const course = await this.prisma.course.findFirst({
      where: { id, organizationId: this.organizationId() },
      include: {
        school: true,
        subject: true,
        teacher: { include: { user: true } },
        studyPlan: { include: { gradeMetric: true } },
      },
    });
    if (!course) throw new ForbiddenException(COURSE_DENIED);
    return withResolvedColor(course);
  }

  async findManyByGroupId(groupId: string) {
    const organizationId = this.organizationId();
    const group = await this.prisma.classGroup.findFirst({
      where: { id: groupId, organizationId },
      select: { studyPlanId: true },
    });
    if (!group) return [];
    return this.prisma.course.findMany({
      where: { studyPlanId: group.studyPlanId, organizationId },
      orderBy: { name: 'asc' },
      include: {
        school: true,
        subject: true,
        teacher: { include: { user: true } },
        studyPlan: { include: { gradeMetric: true } },
      },
    });
  }

  async update(id: string, updateCourseInput: UpdateCourseInput) {
    const organizationId = this.organizationId();
    const current = await this.assertInOrganization(id, organizationId);
    const data = this.toCourseUpdateData(updateCourseInput);
    // A course never leaves its organization; its school follows its study plan.
    if (updateCourseInput.studyPlanId !== undefined) {
      const studyPlan = await this.studyPlanInOrganization(updateCourseInput.studyPlanId, organizationId);
      data.schoolId = studyPlan.schoolId;
    }
    if (updateCourseInput.subjectId !== undefined) {
      await this.subjectInOrganization(updateCourseInput.subjectId, organizationId);
    }
    if (updateCourseInput.teacherId) {
      await this.assertTeacherInOrganization(updateCourseInput.teacherId, organizationId);
    }
    // A new study plan re-syncs the course's plan enrollments in the same transaction (decided 2026-11-20).
    const planChanged =
      updateCourseInput.studyPlanId !== undefined && updateCourseInput.studyPlanId !== current.studyPlanId;
    return this.prisma.$transaction(async (tx) => {
      const course = await tx.course.update({
        where: { id },
        data,
        include: { school: true, subject: true, studyPlan: true },
      });
      if (planChanged) await resyncCoursePlan(tx, course);
      return course;
    });
  }

  private toCourseUpdateData(input: UpdateCourseInput): Prisma.CourseUncheckedUpdateInput {
    const source = input as unknown as Record<string, unknown>;
    const data: Prisma.CourseUncheckedUpdateInput = {};

    const scalarFields: (keyof CreateCourseInput)[] = [
      'name',
      'code',
      'shortName',
      'color',
      'subjectId',
      'studyPlanId',
      'teacherId',
    ];

    for (const key of scalarFields) {
      const value = source[key as string];
      if (value !== undefined) {
        (data as Record<string, unknown>)[key] = value;
      }
    }

    return data;
  }

  async remove(id: string) {
    await this.assertInOrganization(id, this.organizationId());
    return this.prisma.course.delete({ where: { id } });
  }
}
