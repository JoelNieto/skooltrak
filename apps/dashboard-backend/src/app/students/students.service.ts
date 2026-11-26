import { FetchDataQueryDto, PaginatedResponseDto } from '@/api-contracts';
import type { AuthUserContext } from '@/auth';
import { AuthService, OnboardingStep, sendUserInvitation } from '@/auth';
import { Prisma } from '@generated/prisma';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Scope,
  UnauthorizedException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import { Request } from 'express';
import * as QRCode from 'qrcode';
import { ACTIVE_ENROLLMENT, enrolledCourses, enrolledIn, syncStudentPlan } from '../courses/course-roster';
import { PrismaService, STUDENT_PERSONAL_DETAILS } from '../prisma.service';
import { CreateStudentInput } from './dto/create-student.input';
import { UpdateStudentInput } from './dto/update-student.input';
import { PLAN_METRIC_INCLUDE, withEffectiveMetric } from '../study-plans/plan-settings';

export const STUDENT_DENIED = 'No tienes acceso a este estudiante';
export const REFS_DENIED = 'La escuela o el grupo no pertenecen a tu organización';

const STAFF_ROLES = new Set(['ORG_ADMIN', 'ADMIN', 'SYSADMIN', 'TEACHER']);

/**
 * Student lists and full records are for staff of the organization. Students and parents hold
 * VIEW_STUDENTS for other features, so the permission alone doesn't decide.
 */
export function isStudentStaff(user: AuthUserContext | undefined): boolean {
  return STAFF_ROLES.has(user?.role?.toUpperCase() ?? '');
}

@Injectable({ scope: Scope.REQUEST })
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  /**
   * Actor + organization pulled from the authenticated request. `BetterAuthGuard`
   * populates `req.user` as an `AuthUserContext`, whose id field is `userId`
   * (not `id`) — reading `id` silently yielded `undefined` for every actor.
   */
  /** The caller's organization; lists without one are refused. */
  private callerOrganization(): string {
    const { organizationId } = this.requestActor();
    if (!organizationId) throw new ForbiddenException(STUDENT_DENIED);
    return organizationId;
  }

  private requestActor(): { userId?: string; organizationId?: string } {
    const user = (this.request as { user?: AuthUserContext } | undefined)?.user;
    return { userId: user?.userId, organizationId: user?.organizationId ?? undefined };
  }
  async create(createStudentInput: CreateStudentInput) {
    const {
      email,
      schoolId,
      classGroupId,
      parentIds,
      firstName,
      middleName,
      fatherName,
      motherName,
      documentId,
      birthDate,
      gender,
      address,
      phone,
      enrollmentStatus,
      bloodType,
      allergies,
      medicalNotes,
      emergencyContactName,
      emergencyContactPhone,
    } = createStudentInput;
    // The caller's organization, never the body's; the school and group must belong to it.
    const organizationId = await this.assertOrganizationRefs(schoolId, classGroupId);

    const role = await this.prisma.role.findFirstOrThrow({
      where: {
        organizationId: null,
        name: 'STUDENT',
      },
    });

    // Get organization name for the welcome email
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });

    // Random, high-entropy placeholder secret. Never derived from the document
    // ID (which is low-entropy and often known). The account is only usable once
    // the user sets their own password via the invitation reset link.
    const hashedPassword = bcrypt.hashSync(randomBytes(32).toString('hex'), 10);

    const existingUser = email
      ? await this.prisma.user.findUnique({
          where: { email },
          include: { student: true },
        })
      : null;

    if (existingUser?.student) {
      throw new ConflictException('Student already exists, contact support');
    }

    let user: { id: string } | undefined;
    if (email) {
      if (existingUser) {
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            firstName,
            lastName: fatherName,
            name: `${firstName} ${fatherName}`,
            organizationId,
            roleId: role.id,
            password: hashedPassword,
            onboardingStep: OnboardingStep.COMPLETED, // Admin-created students skip onboarding
          },
        });
        user = { id: existingUser.id };

        const credentialAccount = await this.prisma.account.findFirst({
          where: { userId: existingUser.id, providerId: 'credential' },
        });
        if (credentialAccount) {
          await this.prisma.account.update({
            where: { id: credentialAccount.id },
            data: { password: hashedPassword },
          });
        } else {
          await this.prisma.account.create({
            data: {
              id: randomUUID(),
              accountId: existingUser.id,
              providerId: 'credential',
              userId: existingUser.id,
              password: hashedPassword,
            },
          });
        }
      } else {
        user = await this.prisma.user.create({
          data: {
            firstName,
            lastName: fatherName,
            name: `${firstName} ${fatherName}`,
            email: email,
            color: this.getRandomPastelColor(),
            password: hashedPassword,
            organizationId,
            roleId: role.id,
            emailVerified: false, // Will be verified when user clicks the email link
            onboardingStep: OnboardingStep.COMPLETED, // Admin-created students skip onboarding
          },
        });

        await this.prisma.account.create({
          data: {
            id: randomUUID(),
            accountId: user.id,
            providerId: 'credential',
            userId: user.id,
            password: hashedPassword,
          },
        });
      }
    }

    // Convert birthDate properly - handle both Date and string
    const parsedBirthDate = birthDate instanceof Date ? birthDate : new Date(birthDate);

    const studentData = {
      firstName,
      middleName,
      fatherName,
      motherName,
      documentId,
      enrollmentCode: await this.generateEnrollmentCode(),
      birthDate: parsedBirthDate,
      gender,
      address,
      phone,
      enrollmentStatus: enrollmentStatus || 'ACTIVE',
      bloodType: bloodType || '',
      allergies: allergies || '',
      medicalNotes: medicalNotes || '',
      emergencyContactName: emergencyContactName || '',
      emergencyContactPhone: emergencyContactPhone || '',
      userId: user?.id ?? null,
      organizationId,
      schoolId,
      classGroupId: classGroupId || null,
      parents: parentIds?.length ? { connect: parentIds.map((id) => ({ id })) } : undefined,
    };

    this.logger.log(`Creating student with data: ${JSON.stringify(studentData, null, 2)}`);

    try {
      // Enroll the student in their plan's courses in the same transaction (ACA-001 BR .15).
      const student = await this.prisma.$transaction(async (tx) => {
        const created = await tx.student.create({
          data: studentData,
          include: { classGroup: true, user: true, parents: true },
        });
        await syncStudentPlan(tx, created.id, created.classGroupId);
        return created;
      });

      if (classGroupId) {
        await this.recordClassGroupChange(student.id, classGroupId, 'create');
      }

      // Send welcome invitation email (only when the student has an auth user).
      if (email) {
        try {
          await sendUserInvitation({
            prisma: this.prisma,
            email,
            name: `${firstName} ${fatherName}`,
            role: 'student',
            organizationName: organization?.name || 'Skooltrak',
          });
          await this.prisma.invitationStatus.upsert({
            where: { userId: user.id },
            create: { userId: user.id, status: 'SENT' },
            update: { status: 'SENT' },
          });
          await this.prisma.onboardingAuditLog.create({
            data: {
              action: 'INVITATION_CREATED',
              userId: user.id,
              organizationId,
              detail: `email=${email}`,
            },
          });
          this.logger.log(`Welcome invitation sent to student: ${email}`);
        } catch (emailError) {
          // Record the failure so admins can see + retry; don't fail the creation.
          await this.prisma.invitationStatus.upsert({
            where: { userId: user.id },
            create: { userId: user.id, status: 'FAILED', detail: (emailError as Error).message },
            update: { status: 'FAILED', detail: (emailError as Error).message },
          });
          await this.prisma.onboardingAuditLog.create({
            data: {
              action: 'INVITATION_EMAIL_FAILED',
              userId: user.id,
              organizationId,
              detail: `create: ${(emailError as Error).message}`,
            },
          });
          this.logger.error(`Failed to send welcome invitation to ${email}:`, emailError);
        }
      }


      return student;
    } catch (error) {
      this.logger.error('Prisma error creating student:', error);
      throw error;
    }
  }

  getRandomPastelColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 70%)`;
  }

  /**
   * Generates a unique, human-friendly enrollment code for parent self-linking.
   * Reusable (one code per student) and regenerable/revocable by the school.
   */
  private async generateEnrollmentCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = randomBytes(5)
        .toString('base64')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 8);
      const existing = await this.prisma.student.findUnique({ where: { enrollmentCode: code } });
      if (!existing) return code;
    }
    throw new Error('No se pudo generar un código de matrícula único');
  }

  /**
   * Returns the student's current enrollment code (for school staff to share with the parent).
   */
  async getEnrollmentCode(id: string) {
    await this.assertInCallerOrganization(id);
    return this.prisma.student.findUniqueOrThrow({
      where: { id },
      select: { id: true, enrollmentCode: true, enrollmentCodeGeneratedAt: true },
    });
  }

  /** Enrollment codes are parent-linking credentials: only for students of the caller's organization. */
  /** The caller's organization, after checking that the school (and class group) belong to it. */
  private async assertOrganizationRefs(schoolId: string, classGroupId?: string | null): Promise<string> {
    const { organizationId } = this.requestActor();
    if (!organizationId) throw new ForbiddenException(REFS_DENIED);
    const school = await this.prisma.school.findFirst({ where: { id: schoolId, organizationId }, select: { id: true } });
    if (!school) throw new ForbiddenException(REFS_DENIED);
    if (classGroupId) {
      const group = await this.prisma.classGroup.findFirst({
        where: { id: classGroupId, organizationId, schoolId },
        select: { id: true },
      });
      if (!group) throw new ForbiddenException(REFS_DENIED);
    }
    return organizationId;
  }

  /**
   * Throws 403 unless the caller may read this student's record: staff of the student's
   * organization, the student, or a linked parent (parents can span organizations, BR-HOM-001.9).
   */
  async assertCanRead(id: string): Promise<void> {
    const user = (this.request as { user?: AuthUserContext } | undefined)?.user;
    if (!user?.userId) throw new ForbiddenException(STUDENT_DENIED);
    const student = await this.prisma.student.findUnique({
      where: { id },
      select: { organizationId: true, userId: true, parents: { where: { userId: user.userId }, select: { id: true } } },
    });
    if (!student) throw new ForbiddenException(STUDENT_DENIED);
    if (isStudentStaff(user) && student.organizationId === user.organizationId) return;
    if (student.userId === user.userId || student.parents.length) return;
    throw new ForbiddenException(STUDENT_DENIED);
  }

  async assertInCallerOrganization(id: string): Promise<void> {
    const { organizationId } = this.requestActor();
    if (!organizationId) throw new ForbiddenException('El estudiante no pertenece a tu organización');
    const student = await this.prisma.student.findUnique({ where: { id }, select: { organizationId: true } });
    if (!student) throw new NotFoundException('Estudiante no encontrado');
    if (student.organizationId !== organizationId) {
      throw new ForbiddenException('El estudiante no pertenece a tu organización');
    }
  }

  /**
   * Regenerates (revokes) a student's enrollment code. The previous code becomes invalid.
   */
  async regenerateEnrollmentCode(id: string) {
    await this.assertInCallerOrganization(id);
    const code = await this.generateEnrollmentCode();
    const updated = await this.prisma.student.update({
      where: { id },
      data: { enrollmentCode: code, enrollmentCodeGeneratedAt: new Date() },
      select: { id: true, enrollmentCode: true, enrollmentCodeGeneratedAt: true, organizationId: true },
    });
    await this.prisma.onboardingAuditLog.create({
      data: {
        action: 'ENROLLMENT_CODE_REGENERATED',
        userId: null,
        organizationId: updated.organizationId,
        detail: `studentId=${id}`,
      },
    });
    return updated;
  }

  async findAll(fetchDataInput: FetchDataQueryDto) {
    const { skip, pageSize, page, search, orderBy, orderDirection } = fetchDataInput;
    const req = this.request;
    const { organizationId } = req.user as any;

    const orConditions: Prisma.StudentWhereInput[] = [
      { user: { firstName: { contains: search, mode: 'insensitive' } } },
      { user: { lastName: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];

    const [data, total] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        where: {
          organizationId,
          OR: orConditions,
        },
        include: { classGroup: true, user: true },
        skip,
        take: pageSize,
        orderBy: {
          [orderBy ?? 'createdAt']: orderDirection,
        },
      }),
      this.prisma.student.count({
        where: {
          organizationId,
          OR: orConditions,
        },
      }),
    ]);
    return new PaginatedResponseDto(data, total, page, pageSize);
  }

  getCount(fetchDataInput: FetchDataQueryDto) {
    const { search } = fetchDataInput;
    const req = this.request;
    const { organizationId } = req.user as any;
    return this.prisma.student.count({
      where: {
        organizationId,
        OR: [
          { user: { firstName: { contains: search, mode: 'insensitive' } } },
          { user: { lastName: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ],
      },
    });
  }

  findManyBySchoolId(schoolId: string) {
    return this.prisma.student.findMany({
      where: { schoolId, organizationId: this.callerOrganization() },
      include: { classGroup: true, user: true },
    });
  }

  findManyByCourseId(courseId: string) {
    return this.prisma.student.findMany({
      where: enrolledIn(courseId),
      include: { classGroup: true, user: true },
      orderBy: { user: { firstName: 'asc' } },
    });
  }

  findManyByClassGroupId(groupId: string) {
    return this.prisma.student.findMany({
      where: { classGroupId: groupId, organizationId: this.callerOrganization() },
      include: { classGroup: true, user: true },
      orderBy: { user: { firstName: 'asc' } },
    });
  }

  async getStudentsGrades(id: string, periodId?: string) {
    const courses = await this.prisma.course.findMany({
      where: enrolledCourses({ id }),
      orderBy: {
        createdAt: 'asc',
      },
    });

    const courseIds = courses.map((c) => c.id);

    if (courseIds.length === 0) {
      return [];
    }

    // Build grade filter: always filter by published, optionally by periodId
    const where: any = {
      courseId: { in: courseIds },
      published: true,
    };

    if (periodId) {
      where.periodId = periodId;
    }

    // Fetch grades for all courses
    const grades = await this.prisma.grade.findMany({
      where,
      include: {
        studentGrades: {
          where: {
            studentId: id,
          },
        },
        bucket: true,
        period: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group grades by courseId
    const gradesByCourse = new Map<string, typeof grades>();
    grades.forEach((grade) => {
      const existing = gradesByCourse.get(grade.courseId);
      if (existing) {
        existing.push(grade);
      } else {
        gradesByCourse.set(grade.courseId, [grade]);
      }
    });

    // Attach grades to courses
    return courses.map((course) => ({
      ...course,
      grades: gradesByCourse.get(course.id) || [],
    }));
  }

  /** The student with `courses` read from their active roster entries (ACA-001 BR .15). */
  async findOne(id: string) {
    const { courseEnrollments, ...student } = await this.prisma.student.findUniqueOrThrow({
      where: { id },
      // The profile page: the only read that brings back personal details (prisma.service.ts).
      omit: STUDENT_PERSONAL_DETAILS,
      include: {
        classGroup: {
          include: { studyPlan: { include: PLAN_METRIC_INCLUDE } },
        },
        courseEnrollments: {
          where: ACTIVE_ENROLLMENT,
          include: { course: { include: { subject: true, teacher: { include: { user: true } } } } },
          orderBy: { course: { subject: { name: 'asc' } } },
        },
        user: true,
        parents: true,
        studentGrades: {
          include: {
            grade: {
              include: {
                period: true,
                bucket: true,
                course: { include: { subject: true } },
              },
            },
          },
        },
      },
    });
    const classGroup = student.classGroup && {
      ...student.classGroup,
      studyPlan: withEffectiveMetric(student.classGroup.studyPlan),
    };
    return { ...student, classGroup, courses: courseEnrollments.map((e) => e.course) };
  }

  async update(id: string, updateStudentInput: UpdateStudentInput) {
    await this.assertInCallerOrganization(id);
    const { email, parentIds, birthDate, ...rest } = updateStudentInput;
    if (rest.classGroupId) {
      const { schoolId } = await this.prisma.student.findUniqueOrThrow({ where: { id }, select: { schoolId: true } });
      await this.assertOrganizationRefs(schoolId, rest.classGroupId);
    }

    // Build update data, only including defined fields
    const updateData: Record<string, unknown> = {};

    // Only add fields that are explicitly provided
    if (rest.firstName !== undefined) updateData.firstName = rest.firstName;
    if (rest.middleName !== undefined) updateData.middleName = rest.middleName;
    if (rest.fatherName !== undefined) updateData.fatherName = rest.fatherName;
    if (rest.motherName !== undefined) updateData.motherName = rest.motherName;
    if (rest.documentId !== undefined) updateData.documentId = rest.documentId;
    if (birthDate !== undefined) updateData.birthDate = new Date(birthDate);
    if (rest.gender !== undefined) updateData.gender = rest.gender;
    if (rest.address !== undefined) updateData.address = rest.address;
    if (rest.phone !== undefined) updateData.phone = rest.phone;
    if (rest.classGroupId !== undefined) updateData.classGroupId = rest.classGroupId || null;
    if (rest.enrollmentStatus !== undefined) updateData.enrollmentStatus = rest.enrollmentStatus;
    if (rest.bloodType !== undefined) updateData.bloodType = rest.bloodType;
    if (rest.allergies !== undefined) updateData.allergies = rest.allergies;
    if (rest.medicalNotes !== undefined) updateData.medicalNotes = rest.medicalNotes;
    if (rest.emergencyContactName !== undefined) updateData.emergencyContactName = rest.emergencyContactName;
    if (rest.emergencyContactPhone !== undefined) updateData.emergencyContactPhone = rest.emergencyContactPhone;

    // If parentIds is provided, update the relationship
    if (parentIds !== undefined) {
      updateData.parents = {
        set: parentIds.map((parentId) => ({ id: parentId })),
      };
    }

    // A class-group change moves the student's plan enrollments in the same transaction
    // (ACA-001 BR .15).
    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.student.update({
        where: { id },
        data: updateData,
        include: { classGroup: true, user: true, parents: true },
      });
      if (rest.classGroupId !== undefined) await syncStudentPlan(tx, id, row.classGroupId);
      return row;
    });



    if (rest.classGroupId !== undefined) {
      const actorId = this.requestActor().userId;
      await this.recordClassGroupChange(id, rest.classGroupId || null, 'update', actorId);
    }

    return updated;
  }

  /**
   * Record a class-group progression change: close any open history row for
   * the student and open a new one for `newClassGroupId` (or just close when
   * cleared). The current `Student.classGroupId` remains the live pointer.
   */
  private async recordClassGroupChange(
    studentId: string,
    newClassGroupId: string | null,
    reason: string,
    createdById?: string,
  ) {
    if (newClassGroupId) {
      const group = await this.prisma.classGroup.findUnique({
        where: { id: newClassGroupId },
        select: { schoolId: true, organizationId: true },
      });
      if (!group) return;
      await this.prisma.studentClassGroupHistory.updateMany({
        where: { studentId, endedAt: null },
        data: { endedAt: new Date() },
      });
      await this.prisma.studentClassGroupHistory.create({
        data: {
          studentId,
          classGroupId: newClassGroupId,
          schoolId: group.schoolId,
          organizationId: group.organizationId,
          reason,
          createdById: createdById ?? null,
        },
      });
    } else {
      await this.prisma.studentClassGroupHistory.updateMany({
        where: { studentId, endedAt: null },
        data: { endedAt: new Date() },
      });
    }
  }

  /**
   * Issue a fresh single-use QR child-connect token for the student and render
   * it as a printable PNG (welcome letters / report cards). Issuing rotates any
   * previously issued unconsumed token for this student. Returns the raw PNG
   * bytes plus the encoded connect URL.
   */
  async getConnectTokenQrPng(id: string): Promise<{ png: Buffer; url: string }> {
    const { userId, organizationId } = this.requestActor();
    if (!organizationId || !userId) {
      throw new UnauthorizedException('No autenticado');
    }
    const { url } = await this.authService.issueChildConnectToken(id, organizationId, userId);
    const png = await QRCode.toBuffer(url, {
      type: 'png',
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'M',
    });
    return { png, url };
  }

  /**
   * Upgrade a profile-only (parent-proxy) student into an independent account:
   * create the auth `User` + credential `Account`, set `Student.userId`, and
   * send a passwordless magic link. History/grades/attendance are preserved
   * because only the missing `userId` link is added (Phase 2.6 / task 31).
   */
  async attachUser(id: string, input: { email: string; firstName?: string; lastName?: string }) {
    await this.assertInCallerOrganization(id);
    const email = input.email?.toLowerCase().trim();
    if (!email) {
      throw new ConflictException('El correo es obligatorio para crear el acceso');
    }

    const student = await this.prisma.student.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        userId: true,
        firstName: true,
        fatherName: true,
        organizationId: true,
      },
    });

    if (student.userId) {
      throw new ConflictException('El estudiante ya tiene una cuenta de acceso');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese correo');
    }

    const role = await this.prisma.role.findFirstOrThrow({
      where: { organizationId: null, name: 'STUDENT' },
    });

    // High-entropy placeholder; the student sets their own password (or keeps
    // using magic links) — this secret is never usable directly.
    const hashedPassword = bcrypt.hashSync(randomBytes(32).toString('hex'), 10);

    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName: input.firstName ?? student.firstName,
          lastName: input.lastName ?? student.fatherName,
          name: `${input.firstName ?? student.firstName} ${input.lastName ?? student.fatherName}`,
          email,
          color: this.getRandomPastelColor(),
          password: hashedPassword,
          organizationId: student.organizationId,
          roleId: role.id,
          emailVerified: false,
          onboardingStep: OnboardingStep.COMPLETED,
        },
      });

      await tx.account.create({
        data: {
          id: randomUUID(),
          accountId: user.id,
          providerId: 'credential',
          userId: user.id,
          password: hashedPassword,
        },
      });

      return tx.student.update({
        where: { id: student.id },
        data: { userId: user.id },
        include: { classGroup: true, user: true, parents: true },
      });
    });

    // Send a passwordless login link so the upgraded student can access without
    // a shared password. Failure to email does not roll back the account.
    try {
      await this.authService.requestMagicLink(email);
    } catch (error) {
      this.logger.warn(`Failed to send magic link to attached student ${email}:`, error);
    }

    return updated;
  }

  async remove(id: string) {
    await this.assertInCallerOrganization(id);
    return this.prisma.student.delete({ where: { id } });
  }
}
