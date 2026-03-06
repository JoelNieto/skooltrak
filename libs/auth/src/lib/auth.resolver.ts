import { UseGuards } from '@nestjs/common';
import { Args, Context, Field, Int, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import * as jwt from 'jsonwebtoken';
import { AllowAnonymous, BetterAuthGuard } from './auth.guard';
import { AuthPayload } from './auth.payload';
import { AuthService } from './auth.service';
import { auth } from './better-auth';
import { CreateSchoolWithOrgInput } from './dto/create-school-with-org.input';
import { RequestJoinSchoolInput } from './dto/request-join-school.input';
import { SignUpInput } from './dto/sign-up.input';
import { PrismaService } from './prisma.service';
import { User } from './users/entities/user.entity';

// ==========================================
// Response types
// ==========================================

@ObjectType()
class OnboardingStatus {
  @Field()
  onboardingCompleted: boolean;

  @Field({ nullable: true })
  schoolId?: string;

  @Field({ nullable: true })
  schoolName?: string;

  @Field(() => Int)
  degreesCount: number;

  @Field(() => Int)
  studyPlansCount: number;

  @Field(() => Int)
  coursesCount: number;

  @Field(() => Int)
  groupsCount: number;
}

@ObjectType()
class JoinRequestResult {
  @Field()
  status: string;

  @Field()
  message: string;
}

@ObjectType()
class AvailableSchool {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  shortName: string;

  @Field()
  organizationId: string;

  @Field({ nullable: true })
  logo: string;

  @Field({ nullable: true })
  city: string;

  @Field({ nullable: true })
  country: string;

  @Field({ nullable: true })
  organizationName: string;

  @Field(() => Int)
  studentCount: number;
}

@ObjectType()
class JoinRequestStatus {
  @Field()
  id: string;

  @Field()
  requestedRole: string;

  @Field()
  status: string;

  @Field({ nullable: true })
  schoolName: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
class CheckPendingInvitationResult {
  @Field()
  hasPendingInvitation: boolean;

  @Field({ nullable: true })
  role?: string;

  @Field({ nullable: true })
  organizationName?: string;
}

@ObjectType()
class CreateInvitationAccessLinkResult {
  @Field()
  url: string;
}

@ObjectType()
class LookupAccountForPasswordResetResult {
  @Field()
  found: boolean;

  @Field({ nullable: true })
  roleLabel?: string;

  @Field({ nullable: true })
  displayName?: string;

  @Field({ nullable: true })
  organizationName?: string;
}

@ObjectType()
class PendingJoinRequest {
  @Field()
  id: string;

  @Field()
  requestedRole: string;

  @Field({ nullable: true })
  documentId: string;

  @Field()
  status: string;

  @Field()
  userId: string;

  @Field()
  userFirstName: string;

  @Field()
  userLastName: string;

  @Field()
  userEmail: string;

  @Field({ nullable: true })
  userImage: string;

  @Field()
  schoolId: string;

  @Field()
  schoolName: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
class NotificationItem {
  @Field()
  id: string;

  @Field()
  type: string;

  @Field()
  title: string;

  @Field()
  message: string;

  @Field()
  read: boolean;

  @Field({ nullable: true })
  relatedId: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
class CreateSchoolResult {
  @Field()
  accessToken: string;

  @Field()
  schoolId: string;
}

// ==========================================
// Resolver
// ==========================================

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  // ==========================================
  // Authentication
  // ==========================================

  @Mutation(() => AuthPayload)
  @AllowAnonymous()
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
    @Context() context: any,
  ): Promise<AuthPayload> {
    const response = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    });

    if (!response.ok) {
      throw new Error('Credenciales inválidas');
    }

    const data = await response.json();

    // Set cookies from better-auth response
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader && context.res) {
      context.res.setHeader('set-cookie', setCookieHeader);
    }

    // Get full user data to generate JWT
    const user = await this.prisma.user.findUnique({
      where: { id: data.user.id },
      include: { role: { include: { permissions: true } } },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const accessToken = this.authService.generateJwt(user);
    return { accessToken };
  }

  // ==========================================
  // Email Verification (pre-signup)
  // ==========================================

  @Mutation(() => Boolean)
  @AllowAnonymous()
  async sendVerificationLink(@Args('email') email: string): Promise<boolean> {
    return this.authService.sendVerificationLink(email);
  }

  @Query(() => Boolean)
  @AllowAnonymous()
  async validateEmailToken(
    @Args('token') token: string,
    @Args('email') email: string,
  ): Promise<boolean> {
    return this.authService.validateEmailToken(token, email);
  }

  @Query(() => CheckPendingInvitationResult)
  @AllowAnonymous()
  async checkPendingInvitation(
    @Args('email') email: string,
  ): Promise<CheckPendingInvitationResult> {
    return this.authService.checkPendingInvitation(email);
  }

  @Mutation(() => CreateInvitationAccessLinkResult)
  @AllowAnonymous()
  async createInvitationAccessLink(
    @Args('email') email: string,
  ): Promise<CreateInvitationAccessLinkResult> {
    return this.authService.createInvitationAccessLink(email);
  }

  @Mutation(() => Boolean)
  @AllowAnonymous()
  async resendUserInvitation(@Args('email') email: string): Promise<boolean> {
    return this.authService.resendUserInvitation(email);
  }

  // ==========================================
  // Sign Up
  // ==========================================

  @Mutation(() => AuthPayload)
  @AllowAnonymous()
  async signUp(@Args('input') input: SignUpInput): Promise<AuthPayload> {
    return this.authService.signUp(input);
  }

  // ==========================================
  // User info
  // ==========================================

  @UseGuards(BetterAuthGuard)
  @Query(() => User)
  async me(@Context() context: any): Promise<User> {
    const session = context.req.session;
    const userId = session?.user?.id || context.req.user?.userId;

    if (!userId) {
      throw new Error('No autenticado');
    }

    const user = await this.authService.getUser(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    return user as unknown as User;
  }

  @UseGuards(BetterAuthGuard)
  @Mutation(() => User)
  async updateThemePreference(
    @Args('themePreference') themePreference: string,
    @Context() context: any,
  ): Promise<User> {
    const userId = context.req.session?.user?.id || context.req.user?.userId;
    if (!userId) throw new Error('No autenticado');

    const valid = ['light', 'dark', 'system'].includes(themePreference);
    if (!valid) {
      throw new Error('themePreference must be light, dark, or system');
    }

    const user = await this.authService.updateThemePreference(userId, themePreference);
    return user as unknown as User;
  }

  // ==========================================
  // School + Organization creation
  // ==========================================

  @UseGuards(BetterAuthGuard)
  @Mutation(() => CreateSchoolResult)
  async createSchoolWithOrganization(
    @Args('input') input: CreateSchoolWithOrgInput,
    @Context() context: any,
  ): Promise<CreateSchoolResult> {
    const userId = context.req.session?.user?.id || context.req.user?.userId;
    if (!userId) throw new Error('No autenticado');

    const result = await this.authService.createSchoolWithOrganization(userId, input);

    // Generate a new JWT with the updated user data
    const accessToken = this.authService.generateJwt(result.user);
    return { accessToken, schoolId: result.school.id };
  }

  // ==========================================
  // Join School
  // ==========================================

  @UseGuards(BetterAuthGuard)
  @Mutation(() => JoinRequestResult)
  async requestJoinSchool(
    @Args('input') input: RequestJoinSchoolInput,
    @Context() context: any,
  ): Promise<JoinRequestResult> {
    const userId = context.req.session?.user?.id || context.req.user?.userId;
    if (!userId) throw new Error('No autenticado');

    return this.authService.requestJoinSchool(userId, input);
  }

  @UseGuards(BetterAuthGuard)
  @Mutation(() => Boolean)
  async approveJoinRequest(
    @Args('requestId') requestId: string,
    @Args('approve') approve: boolean,
    @Context() context: any,
  ): Promise<boolean> {
    const userId = context.req.session?.user?.id || context.req.user?.userId;
    if (!userId) throw new Error('No autenticado');

    return this.authService.approveJoinRequest(requestId, approve, userId);
  }

  // ==========================================
  // Queries
  // ==========================================

  @UseGuards(BetterAuthGuard)
  @Query(() => [AvailableSchool])
  async availableSchools(): Promise<AvailableSchool[]> {
    const schools = await this.authService.getAvailableSchools();
    return schools.map((s) => ({
      id: s.id,
      name: s.name,
      shortName: s.shortName,
      organizationId: s.organizationId,
      logo: s.logo,
      city: s.city,
      country: s.country,
      organizationName: s.organization?.name || '',
      studentCount: s._count?.students || 0,
    }));
  }

  @UseGuards(BetterAuthGuard)
  @Query(() => [PendingJoinRequest])
  async pendingJoinRequests(@Context() context: any): Promise<PendingJoinRequest[]> {
    const orgId = context.req.user?.organizationId;
    if (!orgId) return [];

    const requests = await this.authService.getPendingJoinRequests(orgId);
    return requests.map((r) => ({
      id: r.id,
      requestedRole: r.requestedRole,
      documentId: r.documentId || '',
      status: r.status,
      userId: r.user.id,
      userFirstName: r.user.firstName,
      userLastName: r.user.lastName,
      userEmail: r.user.email,
      userImage: r.user.image || '',
      schoolId: r.school.id,
      schoolName: r.school.name,
      createdAt: r.createdAt,
    }));
  }

  @UseGuards(BetterAuthGuard)
  @Query(() => JoinRequestStatus, { nullable: true })
  async myJoinRequestStatus(@Context() context: any): Promise<JoinRequestStatus | null> {
    const userId = context.req.session?.user?.id || context.req.user?.userId;
    if (!userId) return null;

    const request = await this.authService.getMyJoinRequestStatus(userId);
    if (!request) return null;

    return {
      id: request.id,
      requestedRole: request.requestedRole,
      status: request.status,
      schoolName: request.school?.name || '',
      createdAt: request.createdAt,
    };
  }

  @UseGuards(BetterAuthGuard)
  @Query(() => [NotificationItem])
  async notifications(@Context() context: any): Promise<NotificationItem[]> {
    const userId = context.req.session?.user?.id || context.req.user?.userId;
    if (!userId) return [];

    const items = await this.authService.getNotifications(userId);
    return items.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      relatedId: n.relatedId || '',
      createdAt: n.createdAt,
    }));
  }

  @UseGuards(BetterAuthGuard)
  @Mutation(() => Boolean)
  async markNotificationRead(
    @Args('notificationId') notificationId: string,
    @Context() context: any,
  ): Promise<boolean> {
    const userId = context.req.session?.user?.id || context.req.user?.userId;
    if (!userId) throw new Error('No autenticado');

    await this.authService.markNotificationRead(notificationId, userId);
    return true;
  }

  // ==========================================
  // Password management
  // ==========================================

  @Query(() => LookupAccountForPasswordResetResult)
  @AllowAnonymous()
  async lookupAccountForPasswordReset(
    @Args('email') email: string,
  ): Promise<LookupAccountForPasswordResetResult> {
    return this.authService.lookupAccountForPasswordReset(email);
  }

  @Mutation(() => Boolean)
  @AllowAnonymous()
  async requestPasswordReset(@Args('email') email: string): Promise<boolean> {
    try {
      await fetch(
        `${process.env['APP_URL'] || 'http://localhost:3000'}/api/auth/request-password-reset`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            redirectTo: `${process.env['APP_URL']}/reset-password`,
          }),
        },
      );
    } catch {
      // Always return true to prevent email enumeration
    }
    return true;
  }

  @Mutation(() => AuthPayload)
  @AllowAnonymous()
  async resetPassword(
    @Args('token') token: string,
    @Args('newPassword') newPassword: string,
    @Context() context: any,
  ): Promise<AuthPayload> {
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
      throw new Error('Token inválido o expirado');
    }

    if (verification.expiresAt < new Date()) {
      await this.prisma.verification.delete({ where: { id: verification.id } });
      throw new Error('Token inválido o expirado');
    }

    let user;
    if (userEmail) {
      user = await this.prisma.user.findUnique({ where: { email: userEmail } });
    } else if (userId) {
      user = await this.prisma.user.findUnique({ where: { id: userId } });
    }

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Check if the user is an invited teacher (has TEACHER role + organization already assigned)
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
        // Invited teachers skip onboarding entirely
        ...(isInvitedTeacher && { onboardingStep: 'completed' }),
      },
    });

    await this.prisma.account.updateMany({
      where: { userId: user.id, providerId: 'credential' },
      data: { password: hashedPassword },
    });

    await this.prisma.verification.delete({ where: { id: verification.id } });

    // Auto-login: sign the user in via Better Auth and return JWT
    const response = await auth.api.signInEmail({
      body: { email: user.email, password: newPassword },
      asResponse: true,
    });

    // Set session cookies from Better Auth response
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader && context.res) {
      context.res.setHeader('set-cookie', setCookieHeader);
    }

    // Get full user data to generate JWT
    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { role: { include: { permissions: true } } },
    });

    const accessToken = this.authService.generateJwt(fullUser!);
    return { accessToken };
  }

  @UseGuards(BetterAuthGuard)
  @Mutation(() => Boolean)
  async changePassword(
    @Args('currentPassword') currentPassword: string,
    @Args('newPassword') newPassword: string,
    @Context() context: any,
  ): Promise<boolean> {
    try {
      const cookies = context.req.headers.cookie;

      const response = await fetch(`${process.env['APP_URL'] || 'http://localhost:3000'}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cookies ? { Cookie: cookies } : {}),
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al cambiar la contraseña');
      }

      return true;
    } catch {
      throw new Error('Error al cambiar la contraseña');
    }
  }

  // ==========================================
  // Email verification (legacy, kept for existing users)
  // ==========================================

  @UseGuards(BetterAuthGuard)
  @Query(() => Boolean)
  async isEmailVerified(@Context() context: any): Promise<boolean> {
    const session = context.req.session;
    const userId = session?.user?.id || context.req.user?.userId;

    if (!userId) return false;

    return this.authService.isEmailVerified(userId);
  }

  // ==========================================
  // Onboarding
  // ==========================================

  @UseGuards(BetterAuthGuard)
  @Query(() => OnboardingStatus)
  async onboardingStatus(@Context() context: any): Promise<OnboardingStatus> {
    const organizationId = context.req.session?.user?.organizationId || context.req.user?.organizationId;

    if (!organizationId) {
      return {
        onboardingCompleted: false,
        degreesCount: 0,
        studyPlansCount: 0,
        coursesCount: 0,
        groupsCount: 0,
      };
    }

    return this.authService.getOnboardingStatus(organizationId);
  }

  @UseGuards(BetterAuthGuard)
  @Mutation(() => Boolean)
  async completeOnboarding(@Context() context: any): Promise<boolean> {
    const organizationId = context.req.session?.user?.organizationId || context.req.user?.organizationId;
    const userId = context.req.session?.user?.id || context.req.user?.userId;

    if (!organizationId) {
      throw new Error('No se encontró una organización');
    }

    await this.authService.completeOnboarding(organizationId, userId);
    return true;
  }

  // ==========================================
  // Sign Out
  // ==========================================

  @UseGuards(BetterAuthGuard)
  @Mutation(() => Boolean)
  async signOut(@Context() context: any): Promise<boolean> {
    const headers = new Headers();
    const cookies = context.req.headers.cookie;
    if (cookies) {
      headers.set('cookie', cookies);
    }

    await auth.api.signOut({ headers });

    if (context.res) {
      context.res.setHeader('set-cookie', [
        'better-auth.session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      ]);
    }

    return true;
  }
}
