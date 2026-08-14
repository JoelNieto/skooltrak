import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { auth } from './better-auth';
import { OnboardingStep, assertTransition } from './onboarding-step';
import type { Prisma } from '@generated/prisma';
import { RateLimiter } from './rate-limiter';
import { CreateSchoolWithOrgInput } from './dto/create-school-with-org.input';
import { LinkChildInput } from './dto/link-child.input';
import { RequestJoinSchoolInput } from './dto/request-join-school.input';
import { SignUpInput } from './dto/sign-up.input';
import { PrismaService } from './prisma.service';
import { AuthTokenService } from './auth-token.service';
import { sendEmail, sendMagicLinkEmail, sendUserInvitation } from './resend.service';

/** Enrollment codes older than this are considered expired and must be regenerated. */
export const ENROLLMENT_CODE_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

/** Rate-limit windows for identity-proving endpoints. */
const JOIN_REQUEST_LIMIT = 10;
const JOIN_REQUEST_WINDOW_MS = 15 * 60 * 1000;
const LINK_CHILD_LIMIT = 10;
const LINK_CHILD_WINDOW_MS = 15 * 60 * 1000;

/**
 * Roles allowed to link a child as a parent. Only role-less self-service
 * sign-ups (represented by a null role, handled separately) and existing
 * PARENT accounts may link. Staff (ORG_ADMIN/TEACHER) and STUDENT accounts are
 * blocked so they cannot demote themselves or create spurious parent profiles.
 */
const PARENT_LINKABLE_ROLES = new Set<string>(['PARENT']);

@Injectable()
export class AuthService {
  private readonly rateLimiter = new RateLimiter();

  constructor(
    private prisma: PrismaService,
    private authTokens: AuthTokenService,
  ) {}

  /** Append a row to the onboarding audit log (who/what/when). */
  private async audit(params: {
    action: string;
    actorId?: string | null;
    userId?: string | null;
    organizationId?: string | null;
    detail?: string;
    ip?: string;
  }) {
    await this.prisma.onboardingAuditLog.create({
      data: {
        actorId: params.actorId ?? null,
        userId: params.userId ?? null,
        organizationId: params.organizationId ?? null,
        action: params.action as never,
        detail: params.detail ?? null,
        ip: params.ip ?? null,
      },
    });
  }

  /**
   * Enforce the onboarding state machine and persist a step change.
   * Every write to `User.onboardingStep` must go through here so the
   * transition cannot drift (Phase 2.0).
   */
  private async transitionOnboardingStep(
    userId: string,
    next: OnboardingStep,
    tx?: PrismaService | Prisma.TransactionClient,
  ): Promise<void> {
    const db = tx ?? this.prisma;
    const current = await db.user.findUnique({
      where: { id: userId },
      select: { onboardingStep: true },
    });
    assertTransition(current?.onboardingStep as OnboardingStep | null | undefined, next);
    await db.user.update({
      where: { id: userId },
      data: { onboardingStep: next },
    });
  }

  /** Persist the result of the last invitation email send for a user. */
  private async setInvitationStatus(
    userId: string,
    status: 'PENDING' | 'SENT' | 'FAILED',
    detail?: string,
  ) {
    await this.prisma.invitationStatus.upsert({
      where: { userId },
      create: { userId, status, detail: detail ?? null },
      update: { status, detail: detail ?? null },
    });
  }

  private getRandomPastelColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 80%)`;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Generate JWT token for a user
   */
  generateJwt(user: {
    id: string;
    email: string;
    organizationId: string | null;
    onboardingStep?: string | null;
    role?: { name: string; permissions?: { descriptiveId: string }[] } | null;
  }): string {
    const jwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role?.name || 'member',
      organizationId: user.organizationId,
      onboardingStep: user.onboardingStep || null,
      permissions: user.role?.permissions?.map((p) => p.descriptiveId) || [],
    };

    const secret = process.env['JWT_SECRET'];
    if (!secret) {
      throw new Error('JWT_SECRET no está configurado');
    }
    return jwt.sign(jwtPayload, secret, { expiresIn: '7d' });
  }

  getUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: { include: { permissions: true, organization: true } },
        teacher: true,
        student: true,
        organization: true,
      },
    });
  }

  async updateThemePreference(userId: string, themePreference: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { themePreference },
      include: {
        role: { include: { permissions: true, organization: true } },
        teacher: true,
        student: true,
        organization: true,
      },
    });
  }

  // ==========================================
  // Email Verification (before user creation)
  // ==========================================

  /**
   * Send a verification link to an email address (no user exists yet).
   * Stores a token in the Verification table and sends an email via Resend.
   */
  async sendVerificationLink(email: string): Promise<boolean> {
    // Check if a user with this email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true, organization: true },
    });

    if (existingUser) {
      // If user exists but has pending invitation (student/teacher), throw specific error
      if (
        !existingUser.emailVerified &&
        existingUser.role?.name &&
        ['STUDENT', 'TEACHER'].includes(existingUser.role.name)
      ) {
        throw new HttpException(
          'Tienes una invitación pendiente. Refresca la página e ingresa tu correo de nuevo.',
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException('Este correo electrónico ya está registrado', HttpStatus.CONFLICT);
    }

    // Generate a random token
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Clean up any previous verifications for this email
    await this.prisma.verification.deleteMany({
      where: { identifier: `signup:${email}` },
    });

    // Store in Verification table
    await this.prisma.verification.create({
      data: {
        id: randomUUID(),
        identifier: `signup:${email}`,
        value: token,
        expiresAt,
      },
    });

    // Build verification URL
    const appUrl = process.env['APP_URL'] || 'http://localhost:4200';
    const verificationUrl = `${appUrl}/register?token=${token}&email=${encodeURIComponent(email)}`;

    // Send email via Resend
    await sendEmail({
      to: email,
      subject: 'Verifica tu correo - Skooltrak',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h1 style="color: #18181b; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">Verifica tu Correo</h1>
              <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
                Has solicitado crear una cuenta en Skooltrak.
              </p>
              <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
                Haz clic en el botón de abajo para verificar tu correo y continuar con el registro:
              </p>
              <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                Verificar Correo y Registrarse
              </a>
              <p style="color: #71717a; font-size: 14px; line-height: 20px; margin: 24px 0 0 0;">
                Este enlace expira en 1 hora. Si no solicitaste una cuenta, puedes ignorar este correo.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return true;
  }

  /**
   * Validate that a verification token is valid and not expired.
   */
  async validateEmailToken(token: string, email: string): Promise<boolean> {
    const verification = await this.prisma.verification.findFirst({
      where: {
        identifier: `signup:${email}`,
        value: token,
      },
    });

    if (!verification) {
      throw new Error('Enlace de verificación inválido');
    }

    if (verification.expiresAt < new Date()) {
      await this.prisma.verification.delete({ where: { id: verification.id } });
      throw new Error('El enlace de verificación ha expirado');
    }

    return true;
  }

  // ==========================================
  // Pending invitation (student/teacher signup)
  // ==========================================

  /**
   * Check if an email has a pending invitation (user created but not yet verified).
   */
  async checkPendingInvitation(email: string): Promise<{
    hasPendingInvitation: boolean;
    role?: 'student' | 'teacher';
    organizationName?: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { role: true, organization: true },
    });

    if (!user || user.emailVerified) {
      return { hasPendingInvitation: false };
    }

    const roleName = user.role?.name;
    if (roleName === 'STUDENT' || roleName === 'TEACHER') {
      return {
        hasPendingInvitation: true,
        role: roleName.toLowerCase() as 'student' | 'teacher',
        organizationName: user.organization?.name ?? undefined,
      };
    }

    return { hasPendingInvitation: false };
  }

  /**
   * Create a one-time access link for a user with pending invitation.
   * Allows them to land directly on reset-password without waiting for email.
   */
  async createInvitationAccessLink(email: string): Promise<{ url: string }> {
    const pending = await this.checkPendingInvitation(email);
    if (!pending.hasPendingInvitation) {
      throw new Error('No hay invitación pendiente para este correo');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { role: true, organization: true, student: true, teacher: true },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const role = user.role?.name === 'TEACHER' ? 'teacher' : 'student';
    const name =
      role === 'teacher' && user.teacher
        ? `${user.teacher.firstName} ${user.teacher.fatherName}`
        : role === 'student' && user.student
          ? `${user.student.firstName} ${user.student.fatherName}`
          : `${user.firstName} ${user.lastName}`;

    // Invalidate existing tokens so only the new link works
    await this.prisma.verification.deleteMany({
      where: { identifier: user.email },
    });

    try {
      await sendUserInvitation({
        prisma: this.prisma,
        email: user.email,
        name,
        role,
        organizationName: user.organization?.name || 'Skooltrak',
      });
      await this.setInvitationStatus(user.id, 'SENT');
    } catch (error) {
      await this.setInvitationStatus(user.id, 'FAILED', (error as Error).message);
      await this.audit({
        action: 'INVITATION_EMAIL_FAILED',
        userId: user.id,
        organizationId: user.organizationId,
        detail: `create-invitation-access-link: ${(error as Error).message}`,
      });
      throw error;
    }

    const appUrl = process.env['APP_URL'] || 'http://localhost:4200';
    const verification = await this.prisma.verification.findFirst({
      where: { identifier: user.email },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      throw new Error('Error al crear el enlace');
    }

    return {
      url: `${appUrl}/reset-password?token=${verification.value}&email=${encodeURIComponent(user.email)}`,
    };
  }

  /**
   * Resend invitation email for a user with pending setup (student/teacher).
   */
  async resendUserInvitation(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { role: true, organization: true, student: true, teacher: true },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.emailVerified) {
      throw new Error('Este usuario ya completó su registro');
    }

    const roleName = user.role?.name;
    if (roleName !== 'STUDENT' && roleName !== 'TEACHER') {
      throw new Error('Solo se pueden reenviar invitaciones para estudiantes y docentes');
    }

    const role = roleName.toLowerCase() as 'teacher' | 'student';
    const name =
      role === 'teacher' && user.teacher
        ? `${user.teacher.firstName} ${user.teacher.fatherName}`
        : role === 'student' && user.student
          ? `${user.student.firstName} ${user.student.fatherName}`
          : `${user.firstName} ${user.lastName}`;

    // Invalidate any existing verification tokens for this email
    await this.prisma.verification.deleteMany({
      where: { identifier: user.email },
    });

    await this.setInvitationStatus(user.id, 'PENDING');

    try {
      await sendUserInvitation({
        prisma: this.prisma,
        email: user.email,
        name,
        role,
        organizationName: user.organization?.name || 'Skooltrak',
      });
      await this.setInvitationStatus(user.id, 'SENT');
      await this.audit({
        action: 'RESEND_INVITATION',
        actorId: user.id,
        userId: user.id,
        organizationId: user.organizationId,
        detail: `email=${user.email}`,
      });
    } catch (error) {
      await this.setInvitationStatus(user.id, 'FAILED', (error as Error).message);
      await this.audit({
        action: 'INVITATION_EMAIL_FAILED',
        userId: user.id,
        organizationId: user.organizationId,
        detail: `resend: ${(error as Error).message}`,
      });
      throw error;
    }

    return true;
  }

  /**
   * Look up account by email for password reset confirmation.
   * Returns display info when found so user can approve/reject before sending reset link.
   */
  async lookupAccountForPasswordReset(email: string): Promise<{
    found: boolean;
    roleLabel?: string;
    displayName?: string;
    organizationName?: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        role: true,
        organization: true,
        student: true,
        teacher: true,
        parents: true,
      },
    });

    if (!user) {
      return { found: false };
    }

    const roleName = user.role?.name;
    let roleLabel = 'Usuario';
    let displayName = `${user.firstName} ${user.lastName}`;

    if (roleName === 'STUDENT' && user.student) {
      roleLabel = 'Estudiante';
      displayName = `${user.student.firstName} ${user.student.fatherName}`;
    } else if (roleName === 'TEACHER' && user.teacher) {
      roleLabel = 'Docente';
      displayName = `${user.teacher.firstName} ${user.teacher.fatherName}`;
    } else if (roleName === 'PARENT' && user.parents?.length) {
      roleLabel = 'Padre/Representante';
      displayName = `${user.parents[0].firstName} ${user.parents[0].fatherName}`;
    } else if (roleName === 'ORG_ADMIN' || roleName === 'SYSADMIN') {
      roleLabel = 'Administrador';
    }

    return {
      found: true,
      roleLabel,
      displayName,
      organizationName: user.organization?.name ?? undefined,
    };
  }

  // ==========================================
  // Sign Up (after email verification)
  // ==========================================

  /**
   * Create a new user after email has been verified via link.
   * Only creates User + Account. No org/role/school.
   */
  async signUp(input: SignUpInput) {
    const { token, email, firstName, lastName, password } = input;

    // Validate the verification token
    const verification = await this.prisma.verification.findFirst({
      where: {
        identifier: `signup:${email}`,
        value: token,
      },
    });

    if (!verification) {
      throw new Error('Enlace de verificación inválido');
    }

    if (verification.expiresAt < new Date()) {
      await this.prisma.verification.delete({ where: { id: verification.id } });
      throw new Error('El enlace de verificación ha expirado');
    }

    // Check if email already exists (race condition guard)
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Este correo electrónico ya está registrado');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and account in a transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name: `${firstName} ${lastName}`.trim(),
          firstName,
          lastName,
          password: hashedPassword,
          color: this.getRandomPastelColor(),
          emailVerified: true, // Already verified via link
          onboardingStep: OnboardingStep.CHOOSE_PATH,
          // roleId: null (no role yet)
          // organizationId: null (no org yet)
        },
        include: { role: { include: { permissions: true } } },
      });

      // Create Account for better-auth
      await tx.account.create({
        data: {
          id: randomUUID(),
          accountId: user.id,
          providerId: 'credential',
          userId: user.id,
          password: hashedPassword,
        },
      });

      // Delete the used verification token
      await tx.verification.delete({ where: { id: verification.id } });

      return user;
    });

    // Generate JWT
    const accessToken = this.generateJwt(user);
    return { accessToken };
  }

  // ==========================================
  // School + Organization creation (onboarding path 1)
  // ==========================================

  /**
   * Create an organization and school for a user who chose to create a new school.
   */
  async createSchoolWithOrganization(userId: string, input: CreateSchoolWithOrgInput) {
    const { schoolName, schoolShortName } = input;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Usuario no encontrado');
    if (user.organizationId) throw new Error('El usuario ya pertenece a una organización');

    // Generate unique slug
    const baseSlug = this.generateSlug(schoolName);
    let slug = baseSlug;
    let counter = 1;
    while (await this.prisma.organization.findFirst({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create Organization
      const organization = await tx.organization.create({
        data: {
          name: schoolName,
          slug,
          description: '',
          active: true,
          onboardingCompleted: false,
        },
      });

      // 2. Create ORG_ADMIN Role for this organization with all permissions
      const allPermissions = await tx.permission.findMany({
        select: { id: true },
      });

      const role = await tx.role.create({
        data: {
          name: 'ORG_ADMIN',
          description: 'Organization Administrator',
          organizationId: organization.id,
          permissions: {
            connect: allPermissions.map((p) => ({ id: p.id })),
          },
        },
        include: { permissions: true },
      });

      // 3. Assign role and org to user
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          roleId: role.id,
          organizationId: organization.id,
        },
        include: { role: { include: { permissions: true } } },
      });

      // 4. Create Member (owner)
      await tx.member.create({
        data: {
          id: randomUUID(),
          organizationId: organization.id,
          userId: userId,
          role: 'owner',
        },
      });

      // 5. Create School
      const school = await tx.school.create({
        data: {
          name: schoolName,
          shortName: schoolShortName,
          organizationId: organization.id,
          logo: '',
          address: '',
          city: '',
          state: '',
          zip: '',
          country: '',
          email: '',
          phone: '',
          website: '',
        },
      });

      return { user: updatedUser, organization, school };
    });

    // Persist the onboarding step through the enforced state machine.
    await this.transitionOnboardingStep(userId, OnboardingStep.SCHOOL_SETUP);

    return result;
  }

  // ==========================================
  // Join School (onboarding path 2)
  // ==========================================

  /**
   * Request to join an existing school with a specific role.
   */
  async requestJoinSchool(
    userId: string,
    input: RequestJoinSchoolInput,
    opts?: { ip?: string },
  ) {
    const { schoolId, requestedRole, documentId } = input;
    const ip = opts?.ip ?? 'unknown';

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Usuario no encontrado');

    // PARENT joins are code-driven: the school/org is derived from the code,
    // so no `schoolId` is required (or trusted) on the request.
    if (requestedRole === 'PARENT') {
      if (!input.enrollmentCode) {
        throw new Error(
          'Para vincular a un estudiante proporciona el código de matrícula. Contacta a la escuela si no lo tienes.',
        );
      }
      return this.linkChildByCode(userId, { enrollmentCode: input.enrollmentCode }, { ip });
    }

    if (!schoolId) {
      throw new Error('schoolId es requerido para este tipo de solicitud');
    }

    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      include: { organization: true },
    });
    if (!school) throw new Error('Escuela no encontrada');

    const orgId = school.organizationId;

    // Rate-limit identity-proving join attempts per IP
    const limit = this.rateLimiter.hit(`join:${ip}`, JOIN_REQUEST_LIMIT, JOIN_REQUEST_WINDOW_MS);
    if (!limit.allowed) {
      await this.audit({
        action: 'REQUEST_JOIN_SCHOOL',
        actorId: userId,
        userId,
        organizationId: orgId,
        detail: `Rate limited (retry after ${Math.ceil(limit.retryAfterMs / 1000)}s)`,
        ip,
      });
      throw new HttpException(
        'Demasiados intentos. Inténtalo de nuevo más tarde.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    switch (requestedRole) {
      case 'STUDENT':
        await this.audit({
          action: 'VERIFY_STUDENT',
          userId,
          organizationId: orgId,
          detail: `schoolId=${schoolId}`,
          ip,
        });
        return this.handleStudentJoin(userId, school, orgId, documentId);

      case 'TEACHER':
      case 'ORG_ADMIN':
        return this.handleAdminTeacherJoin(userId, school, orgId, requestedRole);

      default:
        throw new Error('Rol no válido');
    }
  }

  private async handleStudentJoin(
    userId: string,
    school: { id: string; name: string },
    orgId: string,
    documentId?: string,
  ) {
    if (!documentId) {
      throw new Error('El documento de identidad es requerido para estudiantes');
    }

    // Find student record by documentId and schoolId
    const student = await this.prisma.student.findFirst({
      where: { documentId, schoolId: school.id },
    });

    if (!student) {
      throw new Error('No se encontró un estudiante pre-registrado con este documento. Contacta a tu escuela.');
    }

    if (student.userId && student.userId !== userId) {
      throw new Error('Este estudiante ya está vinculado a otra cuenta');
    }

    // Find or get the STUDENT role
    const studentRole = await this.prisma.role.findFirst({
      where: { name: 'STUDENT', organizationId: null },
    });

    if (!studentRole) {
      throw new Error('Rol de estudiante no encontrado en el sistema');
    }

    // Link the user to the student record and assign role
    await this.prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: student.id },
        data: { userId },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          roleId: studentRole.id,
          organizationId: orgId,
        },
      });

      // Create Member
      await tx.member.create({
        data: {
          id: randomUUID(),
          organizationId: orgId,
          userId: userId,
          role: 'member',
        },
      });
    });

    await this.transitionOnboardingStep(userId, OnboardingStep.COMPLETED);

    return { status: 'LINKED', message: 'Cuenta vinculada exitosamente' };
  }

  // NOTE: The document-based, approval-required parent join path
  // (`handleParentJoin`) was removed. Parents now self-link exclusively via a
  // per-student enrollment code (linkChildByCode), which is the only path the
  // UI exposes. This removes a dead, unreachable branch and unifies the parent
  // contract.

  private async handleAdminTeacherJoin(
    userId: string,
    school: { id: string; name: string },
    orgId: string,
    requestedRole: string,
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.joinRequest.create({
        data: {
          userId,
          schoolId: school.id,
          requestedRole,
          status: 'PENDING',
        },
      });

      // Notify all ORG_ADMINs
      await this.notifyOrgAdmins(tx, orgId, userId, school.name, requestedRole);
    });

    await this.transitionOnboardingStep(userId, OnboardingStep.WAITING_APPROVAL);

    return { status: 'PENDING', message: 'Solicitud enviada. Esperando aprobación del administrador.' };
  }

  /**
   * Self-onboard/link a parent to a student using a per-student enrollment code.
   * Resolves Student -> School -> Organization, enforces max 2 parents per student,
   * and federates the global User into that Organization via a per-org Parent profile.
   * No admin approval required.
   */
  async linkChildByCode(userId: string, input: LinkChildInput, opts?: { ip?: string }) {
    const enrollmentCode = input.enrollmentCode?.trim().toUpperCase();
    if (!enrollmentCode) {
      throw new Error('El código de matrícula es requerido');
    }

    const ip = opts?.ip ?? 'unknown';

    // Rate-limit link attempts per IP to blunt brute-force of enrollment codes
    const limit = this.rateLimiter.hit(`link:${ip}`, LINK_CHILD_LIMIT, LINK_CHILD_WINDOW_MS);
    if (!limit.allowed) {
      await this.audit({
        action: 'LINK_CHILD',
        userId,
        detail: `Rate limited (retry after ${Math.ceil(limit.retryAfterMs / 1000)}s)`,
        ip,
      });
      throw new HttpException(
        'Demasiados intentos. Inténtalo de nuevo más tarde.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const student = await this.prisma.student.findUnique({
      where: { enrollmentCode },
      include: {
        school: { include: { organization: true } },
        parents: { select: { id: true, userId: true } },
      },
    });

    if (!student || !student.enrollmentCode) {
      // Do not reveal whether a code exists; log the attempt for auditing.
      await this.audit({ action: 'LINK_CHILD', userId, detail: 'invalid code', ip });
      throw new Error('Código de matrícula inválido');
    }

    // Enrollment codes expire; schools must regenerate them for stale students.
    if (
      student.enrollmentCodeGeneratedAt &&
      Date.now() - new Date(student.enrollmentCodeGeneratedAt).getTime() > ENROLLMENT_CODE_MAX_AGE_MS
    ) {
      await this.audit({
        action: 'LINK_CHILD',
        userId,
        organizationId: student.school.organizationId,
        detail: 'expired code',
        ip,
      });
      throw new Error(
        'El código de matrícula ha expirado. Solicita uno nuevo a la escuela.',
      );
    }

    const orgId = student.school.organizationId;

    // Rule: maximum 2 linked parents per student
    if (student.parents.length >= 2) {
      throw new Error('Este estudiante ya tiene el máximo de 2 padres/tutores vinculados');
    }

    return this.linkParentToStudent(userId, student.id, input, { ip });
  }

  /**
   * Throws if `roleName` belongs to an account that must not link as a parent
   * (staff/students). A `null`/`undefined` role (fresh self-service sign-up) or
   * an existing PARENT is allowed.
   */
  private assertRoleCanLinkAsParent(roleName: string | null | undefined): void {
    if (roleName && !PARENT_LINKABLE_ROLES.has(roleName)) {
      throw new ForbiddenException(
        'Tu cuenta no puede vincularse como padre/tutor. Usa una cuenta de padre/tutor para conectar a un estudiante.',
      );
    }
  }

  /**
   * Fetch the user's current role and reject up-front if they are not allowed
   * to link as a parent. Used before consuming a single-use connect token so a
   * blocked account cannot burn a token meant for a real parent.
   */
  private async assertUserCanLinkAsParent(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: { select: { name: true } } },
    });
    this.assertRoleCanLinkAsParent(user?.role?.name);
  }

  /**
   * Shared parent-linking core used by both the enrollment-code path
   * (`linkChildByCode`) and the QR child-connect token path. Keeping the
   * logic in one place prevents the two flows from diverging.
   */
  private async linkParentToStudent(
    userId: string,
    studentId: string,
    input: LinkChildInput,
    opts?: { ip?: string },
  ) {
    const ip = opts?.ip ?? 'unknown';

    const student = await this.prisma.student.findUniqueOrThrow({
      where: { id: studentId },
      include: {
        school: { include: { organization: true } },
        parents: { select: { id: true, userId: true } },
      },
    });

    const orgId = student.school.organizationId;

    if (student.parents.length >= 2) {
      throw new Error('Este estudiante ya tiene el máximo de 2 padres/tutores vinculados');
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        organizationId: true,
        roleId: true,
        role: { select: { name: true } },
      },
    });

    // Only users without a role yet (fresh self-service sign-ups) or existing
    // parents should receive the PARENT role. Never demote an existing
    // ORG_ADMIN / TEACHER / STUDENT just because they redeemed a child-connect
    // link or enrollment code — the account keeps its role and simply gains the
    // Parent link.
    const currentRoleName = user.role?.name;

    // Staff and students must not be able to link themselves as a parent.
    // Their accounts have a dedicated purpose; a parent connection would either
    // demote them or create a spurious Parent profile. Only role-less
    // self-service sign-ups and existing parents may link a child.
    this.assertRoleCanLinkAsParent(currentRoleName);

    const shouldAssignParentRole = !user.roleId || currentRoleName === 'PARENT';

    const existingParent = await this.prisma.parent.findFirst({
      where: { userId, organizationId: orgId },
    });

    const alreadyLinked = !!existingParent && student.parents.some((p) => p.id === existingParent.id);

    if (alreadyLinked) {
      return {
        status: 'LINKED',
        message: 'Este estudiante ya está vinculado a tu cuenta',
        studentId: student.id,
        organizationId: orgId,
        schoolId: student.schoolId,
      };
    }

    const parentRole = await this.prisma.role.findFirst({
      where: { name: 'PARENT', organizationId: null },
      include: { permissions: true },
    });
    if (!parentRole) {
      throw new Error('Rol de padre/tutor no encontrado en el sistema');
    }

    await this.prisma.$transaction(async (tx) => {
      let parentId: string;

      if (existingParent) {
        parentId = existingParent.id;
        const updateData: Record<string, unknown> = {};
        if (input.firstName) updateData['firstName'] = input.firstName;
        if (input.middleName !== undefined) updateData['middleName'] = input.middleName;
        if (input.fatherName) updateData['fatherName'] = input.fatherName;
        if (input.motherName !== undefined) updateData['motherName'] = input.motherName;
        if (input.documentId) updateData['documentId'] = input.documentId;
        if (input.phone) updateData['phone'] = input.phone;
        if (input.email) updateData['email'] = input.email;
        if (input.relationship) updateData['relationship'] = input.relationship;
        if (input.occupation !== undefined) updateData['occupation'] = input.occupation;
        if (input.workPhone !== undefined) updateData['workPhone'] = input.workPhone;
        if (input.address !== undefined) updateData['address'] = input.address;
        if (Object.keys(updateData).length > 0) {
          await tx.parent.update({ where: { id: parentId }, data: updateData });
        }
      } else {
        const created = await tx.parent.create({
          data: {
            firstName: input.firstName || user.firstName,
            middleName: input.middleName || '',
            fatherName: input.fatherName || user.lastName,
            motherName: input.motherName || '',
            documentId: input.documentId || '',
            phone: input.phone || '',
            email: input.email || user.email,
            relationship: input.relationship || 'PARENT',
            occupation: input.occupation || '',
            workPhone: input.workPhone || '',
            address: input.address || '',
            organizationId: orgId,
            userId,
            students: { connect: { id: student.id } },
          },
        });
        parentId = created.id;
      }

      await tx.parent.update({
        where: { id: parentId },
        data: { students: { connect: { id: student.id } } },
      });

      await tx.member.upsert({
        where: { organizationId_userId: { organizationId: orgId, userId } },
        create: {
          id: randomUUID(),
          organizationId: orgId,
          userId,
          role: 'member',
        },
        update: {},
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          ...(shouldAssignParentRole ? { roleId: parentRole.id } : {}),
          ...(user.organizationId ? {} : { organizationId: orgId }),
        },
      });
    });

    await this.transitionOnboardingStep(userId, OnboardingStep.COMPLETED);

    await this.audit({
      action: 'LINK_CHILD',
      userId,
      organizationId: orgId,
      detail: `studentId=${student.id}`,
      ip,
    });

    return {
      status: 'LINKED',
      message: 'Estudiante vinculado exitosamente',
      studentId: student.id,
      organizationId: orgId,
      schoolId: student.schoolId,
    };
  }

  private async notifyOrgAdmins(
    tx: any,
    orgId: string,
    requestingUserId: string,
    schoolName: string,
    requestedRole: string,
  ) {
    const requestingUser = await tx.user.findUnique({
      where: { id: requestingUserId },
      select: { firstName: true, lastName: true, email: true },
    });

    // Find all ORG_ADMINs for this organization
    const adminUsers = await tx.user.findMany({
      where: {
        organizationId: orgId,
        role: { name: 'ORG_ADMIN' },
      },
      select: { id: true },
    });

    const roleLabels: Record<string, string> = {
      ORG_ADMIN: 'Administrador',
      TEACHER: 'Docente',
      PARENT: 'Padre/Tutor',
    };

    const roleLabel = roleLabels[requestedRole] || requestedRole;
    const userName = requestingUser ? `${requestingUser.firstName} ${requestingUser.lastName}` : 'Un usuario';

    // Create notifications for each admin
    for (const admin of adminUsers) {
      await tx.notification.create({
        data: {
          recipientId: admin.id,
          type: 'JOIN_REQUEST',
          title: 'Nueva solicitud de ingreso',
          message: `${userName} (${requestingUser?.email}) solicita unirse a ${schoolName} como ${roleLabel}.`,
          relatedId: requestingUserId,
        },
      });
    }
  }

  // ==========================================
  // Approve / Reject Join Requests
  // ==========================================

  async approveJoinRequest(requestId: string, approve: boolean, adminUserId: string) {
    const joinRequest = await this.prisma.joinRequest.findUnique({
      where: { id: requestId },
      include: {
        user: true,
        school: { include: { organization: true } },
      },
    });

    if (!joinRequest) throw new Error('Solicitud no encontrada');
    if (joinRequest.status !== 'PENDING') throw new Error('Esta solicitud ya fue procesada');

    // Verify the admin belongs to this organization
    const adminUser = await this.prisma.user.findUnique({
      where: { id: adminUserId },
      include: { role: true },
    });

    if (!adminUser || adminUser.organizationId !== joinRequest.school.organizationId) {
      throw new Error('No tienes permisos para aprobar esta solicitud');
    }

    const orgId = joinRequest.school.organizationId;

    if (!approve) {
      // Reject
      await this.prisma.$transaction(async (tx) => {
        await tx.joinRequest.update({
          where: { id: requestId },
          data: { status: 'REJECTED' },
        });

        await tx.notification.create({
          data: {
            recipientId: joinRequest.userId,
            type: 'REQUEST_REJECTED',
            title: 'Solicitud rechazada',
            message: `Tu solicitud para unirte a ${joinRequest.school.name} ha sido rechazada.`,
          },
        });
      });

      await this.transitionOnboardingStep(joinRequest.userId, OnboardingStep.CHOOSE_PATH);

      await this.audit({
        action: 'REJECT_JOIN_REQUEST',
        actorId: adminUserId,
        userId: joinRequest.userId,
        organizationId: orgId,
        detail: `requestId=${requestId}`,
      });

      return true;
    }

    // Approve
    await this.prisma.$transaction(async (tx) => {
      await tx.joinRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' },
      });

      const { requestedRole } = joinRequest;

      // Find the role (prefer org-specific, fall back to global)
      let role = await tx.role.findFirst({
        where: {
          name: requestedRole,
          OR: [{ organizationId: orgId }, { organizationId: null }],
        },
        include: { permissions: true },
        orderBy: { organizationId: { sort: 'asc', nulls: 'last' } },
      });

      if (!role) {
        // Fallback: create role with appropriate permissions
        const globalRole = await tx.role.findFirst({
          where: { name: requestedRole, organizationId: null },
          include: { permissions: true },
        });
        const permConnections = globalRole?.permissions.map((p) => ({ id: p.id })) ?? [];

        role = await tx.role.create({
          data: {
            name: requestedRole,
            description: `${requestedRole} role`,
            organizationId: requestedRole === 'ORG_ADMIN' ? orgId : null,
            permissions: { connect: permConnections },
          },
          include: { permissions: true },
        });
      }

      // Assign role and org to user
      await tx.user.update({
        where: { id: joinRequest.userId },
        data: {
          roleId: role.id,
          organizationId: orgId,
        },
      });

      // Create Member
      await tx.member.upsert({
        where: {
          organizationId_userId: {
            organizationId: orgId,
            userId: joinRequest.userId,
          },
        },
        create: {
          id: randomUUID(),
          organizationId: orgId,
          userId: joinRequest.userId,
          role: 'member',
        },
        update: {},
      });

      // For PARENT: link the parent record
      if (requestedRole === 'PARENT' && joinRequest.documentId) {
        const parent = await tx.parent.findFirst({
          where: { documentId: joinRequest.documentId, organizationId: orgId },
        });
        if (parent && !parent.userId) {
          await tx.parent.update({
            where: { id: parent.id },
            data: { userId: joinRequest.userId },
          });
        }
      }

      // Notify the user
      await tx.notification.create({
        data: {
          recipientId: joinRequest.userId,
          type: 'REQUEST_APPROVED',
          title: 'Solicitud aprobada',
          message: `Tu solicitud para unirte a ${joinRequest.school.name} ha sido aprobada. ¡Bienvenido!`,
        },
      });
    });

    await this.transitionOnboardingStep(joinRequest.userId, OnboardingStep.COMPLETED);

    await this.audit({
      action: 'APPROVE_JOIN_REQUEST',
      actorId: adminUserId,
      userId: joinRequest.userId,
      organizationId: orgId,
      detail: `requestId=${requestId}`,
    });

    return true;
  }

  // ==========================================
  // Queries
  // ==========================================

  /**
   * Get schools that users can join, filtered by a search term.
   * Search-only (no enumeration) to reduce cross-tenant disclosure.
   */
  async getAvailableSchools(query: string) {
    const term = query.trim();
    return this.prisma.school.findMany({
      where: {
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { organization: { name: { contains: term, mode: 'insensitive' } } },
        ],
      },
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
      take: 50,
    });
  }

  /**
   * Get pending join requests for an organization
   */
  async getPendingJoinRequests(organizationId: string) {
    return this.prisma.joinRequest.findMany({
      where: {
        school: { organizationId },
        status: 'PENDING',
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, image: true },
        },
        school: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get the current join request status for a user
   */
  async getMyJoinRequestStatus(userId: string) {
    return this.prisma.joinRequest.findFirst({
      where: { userId },
      include: {
        school: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Check if a user's email is verified
   */
  async isEmailVerified(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    });
    return user?.emailVerified ?? false;
  }

  /**
   * Get onboarding status for an organization
   */
  async getOnboardingStatus(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        onboardingCompleted: true,
        _count: {
          select: {
            schools: true,
          },
        },
      },
    });

    const school = await this.prisma.school.findFirst({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            degrees: true,
            studyPlans: true,
            courses: true,
            classGroups: true,
          },
        },
      },
    });

    return {
      onboardingCompleted: org?.onboardingCompleted ?? false,
      schoolId: school?.id,
      schoolName: school?.name,
      degreesCount: school?._count?.degrees ?? 0,
      studyPlansCount: school?._count?.studyPlans ?? 0,
      coursesCount: school?._count?.courses ?? 0,
      groupsCount: school?._count?.classGroups ?? 0,
    };
  }

  /**
   * Mark onboarding as completed for an organization
   */
  async completeOnboarding(organizationId: string, userId: string) {
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { onboardingCompleted: true },
    });

    await this.transitionOnboardingStep(userId, OnboardingStep.COMPLETED);

    return true;
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Mark a notification as read
   */
  async markNotificationRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, recipientId: userId },
      data: { read: true },
    });
  }

  /**
   * Email/password login — same behavior as GraphQL `login` mutation.
   */
  async loginWithEmail(
    email: string,
    password: string,
    onSetCookie: (setCookieHeader: string) => void,
  ): Promise<{ accessToken: string }> {
    const response = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    });

    if (!response.ok) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const data = (await response.json()) as { user: { id: string } };

    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      onSetCookie(setCookieHeader);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: data.user.id },
      include: { role: { include: { permissions: true } } },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const accessToken = this.generateJwt(user);
    return { accessToken };
  }

  /**
   * Password reset with token — same behavior as GraphQL `resetPassword` mutation.
   */
  async resetPasswordWithToken(
    token: string,
    newPassword: string,
    onSetCookie: (setCookieHeader: string) => void,
  ): Promise<{ accessToken: string }> {
    let verification = await this.prisma.verification.findFirst({
      where: { value: token },
    });

    let userEmail: string | null = null;
    let userId: string | null = null;

    if (verification) {
      userEmail = verification.identifier;
    } else {
      verification = await this.prisma.verification.findFirst({
        where: { identifier: `reset-password:${token}` },
      });

      if (verification) {
        userId = verification.value;
      }
    }

    if (!verification) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    if (verification.expiresAt < new Date()) {
      await this.prisma.verification.delete({ where: { id: verification.id } });
      throw new UnauthorizedException('Token inválido o expirado');
    }

    let user;
    if (userEmail) {
      user = await this.prisma.user.findUnique({ where: { email: userEmail } });
    } else if (userId) {
      user = await this.prisma.user.findUnique({ where: { id: userId } });
    }

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const userWithRole = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { role: true },
    });
    const isInvitedTeacher = userWithRole?.role?.name === 'TEACHER' && !!userWithRole.organizationId;

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        emailVerified: true,
      },
    });

    if (isInvitedTeacher) {
      await this.transitionOnboardingStep(user.id, OnboardingStep.COMPLETED);
    }

    await this.prisma.account.updateMany({
      where: { userId: user.id, providerId: 'credential' },
      data: { password: hashedPassword },
    });

    await this.prisma.verification.delete({ where: { id: verification.id } });

    const response = await auth.api.signInEmail({
      body: { email: user.email, password: newPassword },
      asResponse: true,
    });

    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      onSetCookie(setCookieHeader);
    }

    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { role: { include: { permissions: true } } },
    });

    const accessToken = this.generateJwt(fullUser!);
    return { accessToken };
  }

  // ==========================================
  // Magic-link auth (Phase 2.2)
  // ==========================================

  /**
   * Request a passwordless login link. Always returns success to avoid
   * account enumeration; the email is only sent when the account exists and is
   * eligible.
   */
  async requestMagicLink(email: string, opts?: { ip?: string }): Promise<{ sent: boolean }> {
    const ip = opts?.ip ?? 'unknown';
    const normalized = email.toLowerCase().trim();

    const limit = this.authTokens.hitRateLimit(`magic:${ip}:${normalized}`);
    if (!limit.allowed) {
      return { sent: false };
    }

    const user = await this.prisma.user.findUnique({ where: { email: normalized } });
    if (!user || user.banned) {
      return { sent: true };
    }

    const { raw } = await this.authTokens.issue({
      type: 'MAGIC_LINK',
      ttlMs: 15 * 60 * 1000,
      userId: user.id,
      metadata: { email: user.email },
    });

    const appUrl = process.env['APP_URL'] || 'http://localhost:4200';
    const url = `${appUrl}/auth/magic-link-callback?token=${raw}`;

    try {
      await sendMagicLinkEmail({
        to: user.email,
        name: `${user.firstName} ${user.lastName}`,
        magicLinkUrl: url,
      });
      await this.audit({ action: 'MAGIC_LINK_ISSUED', userId: user.id, detail: `email=${user.email}`, ip });
    } catch (error) {
      await this.audit({
        action: 'MAGIC_LINK_REJECTED',
        userId: user.id,
        detail: `send-failed: ${(error as Error).message}`,
        ip,
      });
    }

    return { sent: true };
  }

  /**
   * Redeem a magic link. Single-use and time-limited; returns a fresh JWT.
   */
  async verifyMagicLink(token: string, opts?: { ip?: string }): Promise<{ accessToken: string }> {
    const ip = opts?.ip ?? 'unknown';

    const limit = this.authTokens.hitRateLimit(`magic-redeem:${ip}`);
    if (!limit.allowed) {
      throw new HttpException(
        'Demasiados intentos. Inténtalo de nuevo más tarde.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const redeemed = await this.authTokens.redeem({ type: 'MAGIC_LINK', raw: token, ip });
    if (!redeemed || !redeemed.userId) {
      await this.audit({ action: 'MAGIC_LINK_REJECTED', detail: 'invalid/expired/used', ip });
      throw new UnauthorizedException('Enlace mágico inválido o expirado');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: redeemed.userId },
      include: { role: { include: { permissions: true } } },
    });
    if (!user || user.banned) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    await this.audit({ action: 'MAGIC_LINK_CONSUMED', userId: user.id, ip });
    return { accessToken: this.generateJwt(user) };
  }

  // ==========================================
  // QR child-connect tokens (Phase 2.3)
  // ==========================================

  /**
   * Issue a signed, single-use connect token for a student. Rotates any
   * previously issued (unconsumed) token for the same student.
   */
  async issueChildConnectToken(
    studentId: string,
    organizationId: string,
    createdById: string,
  ): Promise<{ token: string; url: string }> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { school: true },
    });
    if (!student) throw new Error('Estudiante no encontrado');
    if (student.organizationId !== organizationId) {
      throw new Error('El estudiante no pertenece a tu organización');
    }

    await this.authTokens.revokeFor({ type: 'CHILD_CONNECT', studentId });

    const { raw } = await this.authTokens.issue({
      type: 'CHILD_CONNECT',
      ttlMs: 30 * 24 * 60 * 60 * 1000,
      studentId,
      organizationId,
      createdById,
    });

    const appUrl = process.env['APP_URL'] || 'http://localhost:4200';
    const url = `${appUrl}/onboarding/connect-child?token=${raw}`;

    await this.audit({
      action: 'CHILD_CONNECT_ISSUED',
      userId: createdById,
      organizationId,
      detail: `studentId=${studentId}`,
      ip: 'unknown',
    });

    return { token: raw, url };
  }

  /**
   * Redeem a QR child-connect token and link the authenticated parent to the
   * intended student. Reuses the shared parent-linking core.
   */
  async redeemChildConnectToken(
    token: string,
    userId: string,
    opts?: { ip?: string },
  ): Promise<{ status: string; studentId: string; organizationId: string; schoolId: string }> {
    const ip = opts?.ip ?? 'unknown';

    // Reject staff/students before consuming the single-use token, so a blocked
    // account cannot burn a token intended for a real parent.
    await this.assertUserCanLinkAsParent(userId);

    const limit = this.authTokens.hitRateLimit(`child-connect-redeem:${ip}`);
    if (!limit.allowed) {
      throw new HttpException(
        'Demasiados intentos. Inténtalo de nuevo más tarde.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const redeemed = await this.authTokens.redeem({ type: 'CHILD_CONNECT', raw: token, ip, actorId: userId });
    if (!redeemed || !redeemed.studentId || !redeemed.organizationId) {
      await this.audit({ action: 'CHILD_CONNECT_REJECTED', userId, detail: 'invalid/expired/used', ip });
      throw new UnauthorizedException('Código QR inválido o expirado');
    }

    const student = await this.prisma.student.findUniqueOrThrow({
      where: { id: redeemed.studentId },
      include: { school: true },
    });
    if (student.organizationId !== redeemed.organizationId) {
      throw new UnauthorizedException('El código no corresponde a tu organización');
    }

    await this.audit({
      action: 'CHILD_CONNECT_CONSUMED',
      userId,
      organizationId: redeemed.organizationId,
      detail: `studentId=${student.id}`,
      ip,
    });

    return this.linkParentToStudent(userId, student.id, {} as LinkChildInput, { ip });
  }
}
