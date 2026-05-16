import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { CreateSchoolWithOrgInput } from './dto/create-school-with-org.input';
import { RequestJoinSchoolInput } from './dto/request-join-school.input';
import { SignUpInput } from './dto/sign-up.input';
import { auth } from './better-auth';
import { PrismaService } from './prisma.service';
import { sendEmail, sendUserInvitation } from './resend.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

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

    return jwt.sign(jwtPayload, process.env['JWT_SECRET'] || 'fallback-secret', { expiresIn: '7d' });
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
        throw new Error(
          'Tienes una invitación pendiente. Refresca la página e ingresa tu correo de nuevo.',
        );
      }
      throw new Error('Este correo electrónico ya está registrado');
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

    await sendUserInvitation({
      prisma: this.prisma,
      email: user.email,
      name,
      role,
      organizationName: user.organization?.name || 'Skooltrak',
    });

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

    await sendUserInvitation({
      prisma: this.prisma,
      email: user.email,
      name,
      role,
      organizationName: user.organization?.name || 'Skooltrak',
    });

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
        parent: true,
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
    } else if (roleName === 'PARENT' && user.parent) {
      roleLabel = 'Padre/Representante';
      displayName = `${user.parent.firstName} ${user.parent.fatherName}`;
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
          onboardingStep: 'choose-path',
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
    let baseSlug = this.generateSlug(schoolName);
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
          onboardingStep: 'school-setup',
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

    return result;
  }

  // ==========================================
  // Join School (onboarding path 2)
  // ==========================================

  /**
   * Request to join an existing school with a specific role.
   */
  async requestJoinSchool(userId: string, input: RequestJoinSchoolInput) {
    const { schoolId, requestedRole, documentId } = input;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Usuario no encontrado');

    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      include: { organization: true },
    });
    if (!school) throw new Error('Escuela no encontrada');

    const orgId = school.organizationId;

    switch (requestedRole) {
      case 'STUDENT':
        return this.handleStudentJoin(userId, school, orgId, documentId);

      case 'PARENT':
        return this.handleParentJoin(userId, school, orgId, documentId);

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
          onboardingStep: 'completed',
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

    return { status: 'LINKED', message: 'Cuenta vinculada exitosamente' };
  }

  private async handleParentJoin(
    userId: string,
    school: { id: string; name: string },
    orgId: string,
    documentId?: string,
  ) {
    if (!documentId) {
      throw new Error('El documento de identidad es requerido para padres');
    }

    // Find parent record by documentId and organization
    const parent = await this.prisma.parent.findFirst({
      where: { documentId, organizationId: orgId },
    });

    if (!parent) {
      throw new Error('No se encontró un padre/tutor pre-registrado con este documento. Contacta a tu escuela.');
    }

    if (parent.userId && parent.userId !== userId) {
      throw new Error('Este padre/tutor ya está vinculado a otra cuenta');
    }

    // Create a join request for admin approval
    await this.prisma.$transaction(async (tx) => {
      await tx.joinRequest.create({
        data: {
          userId,
          schoolId: school.id,
          requestedRole: 'PARENT',
          documentId,
          status: 'PENDING',
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { onboardingStep: 'waiting-approval' },
      });

      // Notify all ORG_ADMINs
      await this.notifyOrgAdmins(tx, orgId, userId, school.name, 'PARENT');
    });

    return { status: 'PENDING', message: 'Solicitud enviada. Esperando aprobación del administrador.' };
  }

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

      await tx.user.update({
        where: { id: userId },
        data: { onboardingStep: 'waiting-approval' },
      });

      // Notify all ORG_ADMINs
      await this.notifyOrgAdmins(tx, orgId, userId, school.name, requestedRole);
    });

    return { status: 'PENDING', message: 'Solicitud enviada. Esperando aprobación del administrador.' };
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

        await tx.user.update({
          where: { id: joinRequest.userId },
          data: { onboardingStep: 'choose-path' }, // Allow them to try again
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
          onboardingStep: 'completed',
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

    return true;
  }

  // ==========================================
  // Queries
  // ==========================================

  /**
   * Get all available schools that users can join
   */
  async getAvailableSchools() {
    return this.prisma.school.findMany({
      include: {
        organization: {
          select: { id: true, name: true },
        },
        _count: {
          select: { students: true },
        },
      },
      orderBy: { name: 'asc' },
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

    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingStep: 'completed' },
    });

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
    const isInvitedTeacher =
      userWithRole?.role?.name === 'TEACHER' && !!userWithRole.organizationId;

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        emailVerified: true,
        ...(isInvitedTeacher && { onboardingStep: 'completed' }),
      },
    });

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
}
