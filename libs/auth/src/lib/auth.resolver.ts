import { UseGuards } from '@nestjs/common';
import { Args, Context, Field, Int, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import * as jwt from 'jsonwebtoken';
import { AllowAnonymous, BetterAuthGuard } from './auth.guard';
import { AuthPayload } from './auth.payload';
import { AuthService } from './auth.service';
import { auth } from './better-auth';
import { SignUpInput } from './dto/sign-up.input';
import { PrismaService } from './prisma.service';
import { User } from './users/entities/user.entity';

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

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Mutation(() => AuthPayload)
  @AllowAnonymous()
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
    @Context() context: any,
  ): Promise<AuthPayload> {
    // Use better-auth API for sign in
    const response = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
      asResponse: true,
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    const data = await response.json();

    // Set cookies from better-auth response
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader && context.res) {
      context.res.setHeader('set-cookie', setCookieHeader);
    }

    // Get full user data to generate JWT with required fields
    const user = await this.prisma.user.findUnique({
      where: { id: data.user.id },
      include: {
        role: { include: { permissions: true } },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate JWT for backward compatibility with frontend
    const jwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role?.name || 'member',
      organizationId: user.organizationId,
      permissions: user.role?.permissions?.map((p) => p.descriptiveId) || [],
    };

    const accessToken = jwt.sign(jwtPayload, process.env['JWT_SECRET'] || 'fallback-secret', { expiresIn: '7d' });

    return { accessToken };
  }

  @Mutation(() => AuthPayload)
  @AllowAnonymous()
  async signUp(@Args('input') input: SignUpInput): Promise<AuthPayload> {
    // Use the existing service for signup as it handles organization creation
    return this.authService.signUp(input);
  }

  @UseGuards(BetterAuthGuard)
  @Query(() => User)
  async me(@Context() context: any): Promise<User> {
    // Get user from session or from the legacy user object
    const session = context.req.session;
    const userId = session?.user?.id || context.req.user?.userId;

    if (!userId) {
      throw new Error('Not authenticated');
    }

    const user = await this.authService.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  // Password reset mutations
  @Mutation(() => Boolean)
  @AllowAnonymous()
  async requestPasswordReset(@Args('email') email: string): Promise<boolean> {
    try {
      // Call better-auth REST endpoint directly
      const response = await fetch(
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
      // Ignore response - always return true to prevent email enumeration
    } catch {
      // Always return true to prevent email enumeration
    }
    return true;
  }

  @Mutation(() => Boolean)
  @AllowAnonymous()
  async resetPassword(@Args('token') token: string, @Args('newPassword') newPassword: string): Promise<boolean> {
    try {
      const response = await fetch(`${process.env['APP_URL'] || 'http://localhost:3000'}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      if (!response.ok) {
        throw new Error('Invalid or expired token');
      }

      return true;
    } catch {
      throw new Error('Invalid or expired token');
    }
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
        throw new Error('Failed to change password');
      }

      return true;
    } catch {
      throw new Error('Failed to change password');
    }
  }

  // Email verification
  @Mutation(() => Boolean)
  @AllowAnonymous()
  async sendVerificationEmail(@Args('email') email: string): Promise<boolean> {
    try {
      await auth.api.sendVerificationEmail({
        body: {
          email,
          callbackURL: `${process.env['APP_URL']}/verify-email`,
        },
      });
    } catch {
      // Always return true to prevent email enumeration
    }
    return true;
  }

  @Mutation(() => AuthPayload)
  @AllowAnonymous()
  async verifyEmail(@Args('token') token: string): Promise<AuthPayload> {
    const verification = await this.prisma.verification.findFirst({
      where: { value: token },
    });

    const response = await auth.api.verifyEmail({
      query: { token },
    });

    const status = response && 'status' in response ? response.status : false;
    if (!status) {
      throw new Error('Invalid or expired token');
    }

    const identifier = verification?.identifier;
    if (!identifier) {
      throw new Error('No user found for verification token');
    }

    // Get full user data to generate JWT
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ id: identifier }, { email: identifier }],
      },
      include: {
        role: { include: { permissions: true } },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate JWT for the verified user
    const jwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role?.name || 'member',
      organizationId: user.organizationId,
      permissions: user.role?.permissions?.map((p) => p.descriptiveId) || [],
    };

    const accessToken = jwt.sign(jwtPayload, process.env['JWT_SECRET'] || 'fallback-secret', { expiresIn: '7d' });

    return { accessToken };
  }

  // Sign out
  @UseGuards(BetterAuthGuard)
  @Mutation(() => Boolean)
  async signOut(@Context() context: any): Promise<boolean> {
    const headers = new Headers();
    const cookies = context.req.headers.cookie;
    if (cookies) {
      headers.set('cookie', cookies);
    }

    await auth.api.signOut({ headers });

    // Clear cookies in response
    if (context.res) {
      context.res.setHeader('set-cookie', [
        'better-auth.session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      ]);
    }

    return true;
  }

  // Check email verification status
  @UseGuards(BetterAuthGuard)
  @Query(() => Boolean)
  async isEmailVerified(@Context() context: any): Promise<boolean> {
    const session = context.req.session;
    const userId = session?.user?.id || context.req.user?.userId;

    if (!userId) {
      return false;
    }

    return this.authService.isEmailVerified(userId);
  }

  // Onboarding status
  @UseGuards(BetterAuthGuard)
  @Query(() => OnboardingStatus)
  async onboardingStatus(@Context() context: any): Promise<OnboardingStatus> {
    const session = context.req.session;
    const organizationId = session?.user?.organizationId || context.req.user?.organizationId;

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

  // Complete onboarding
  @UseGuards(BetterAuthGuard)
  @Mutation(() => Boolean)
  async completeOnboarding(@Context() context: any): Promise<boolean> {
    const session = context.req.session;
    const organizationId = session?.user?.organizationId || context.req.user?.organizationId;

    if (!organizationId) {
      throw new Error('No organization found');
    }

    await this.authService.completeOnboarding(organizationId);
    return true;
  }

  // Resend verification email
  @UseGuards(BetterAuthGuard)
  @Mutation(() => Boolean)
  async resendVerificationEmail(@Context() context: any): Promise<boolean> {
    const session = context.req.session;
    const userId = session?.user?.id || context.req.user?.userId;

    if (!userId) {
      throw new Error('Not authenticated');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, emailVerified: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      return true; // Already verified
    }

    try {
      await auth.api.sendVerificationEmail({
        body: {
          email: user.email,
          callbackURL: `${process.env['APP_URL'] || 'http://localhost:4200'}/verify-email`,
        },
      });
    } catch (error) {
      console.error('[AuthResolver] Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }

    return true;
  }
}
