import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { AuthenticatedRequest } from './auth.guard';
import { AllowAnonymous, BetterAuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { CreateSchoolWithOrgInput } from './dto/create-school-with-org.input';
import { RequestJoinSchoolInput } from './dto/request-join-school.input';
import { LinkChildInput } from './dto/link-child.input';
import { SignUpInput } from './dto/sign-up.input';

@ApiTags('auth')
@Controller('v1/auth')
@UseGuards(BetterAuthGuard)
export class AuthSessionController {
  constructor(private readonly authService: AuthService) {}

  /** Best-effort client IP for rate-limiting identity-proving endpoints. */
  private clientIp(req: AuthenticatedRequest): string {
    const fwd = req.headers['x-forwarded-for'];
    if (typeof fwd === 'string' && fwd.length > 0) {
      return fwd.split(',')[0].trim();
    }
    if (Array.isArray(fwd) && fwd.length > 0) {
      return fwd[0].trim();
    }
    return req.ip ?? 'unknown';
  }

  @Post('login')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Login (JWT + optional session cookie)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: ' ' },
        password: { type: 'string', example: ' ' },
      },
    },
  })
  async login(@Body() body: { email: string; password: string }, @Res({ passthrough: true }) res: Response) {
    const { accessToken } = await this.authService.loginWithEmail(body.email, body.password, (cookieHeader) => {
      res.setHeader('set-cookie', cookieHeader);
    });
    return { accessToken };
  }

  @Post('reset-password')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() body: { token: string; newPassword: string }, @Res({ passthrough: true }) res: Response) {
    const { accessToken } = await this.authService.resetPasswordWithToken(
      body.token,
      body.newPassword,
      (cookieHeader) => {
        res.setHeader('set-cookie', cookieHeader);
      },
    );
    return { accessToken };
  }

  @Post('send-verification-link')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Send signup verification link to email' })
  async sendVerificationLink(@Body() body: { email: string }) {
    return this.authService.sendVerificationLink(body.email);
  }

  @Post('validate-email-token')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Validate signup email token' })
  async validateEmailToken(@Body() body: { token: string; email: string }) {
    return this.authService.validateEmailToken(body.token, body.email);
  }

  @Post('check-pending-invitation')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Check pending invitation by email' })
  async checkPendingInvitation(@Body() body: { email: string }) {
    return this.authService.checkPendingInvitation(body.email);
  }

  @Post('create-invitation-access-link')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Create access link for pending invitation account' })
  async createInvitationAccessLink(@Body() body: { email: string }) {
    return this.authService.createInvitationAccessLink(body.email);
  }

  @Post('lookup-account-for-password-reset')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Lookup account details for password reset confirmation' })
  async lookupAccountForPasswordReset(@Body() body: { email: string }) {
    return this.authService.lookupAccountForPasswordReset(body.email);
  }

  @Post('sign-up')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Sign up with verified email token' })
  async signUp(@Body() body: SignUpInput) {
    return this.authService.signUp(body);
  }

  @Get('pending-join-requests')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pending join requests for current organization' })
  async pendingJoinRequests(@Req() req: AuthenticatedRequest) {
    const organizationId = req.user?.organizationId ?? null;
    if (!organizationId) return [];
    const requests = await this.authService.getPendingJoinRequests(organizationId);
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

  @Post('approve-join-request')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve or reject a join request' })
  async approveJoinRequest(@Req() req: AuthenticatedRequest, @Body() body: { requestId: string; approve: boolean }) {
    const sessionUserId = (req.session as { user?: { id?: string } } | undefined)?.user?.id;
    const userId = req.user?.userId ?? sessionUserId;
    if (!userId) {
      throw new UnauthorizedException('No autenticado');
    }
    return this.authService.approveJoinRequest(body.requestId, body.approve, userId);
  }

  @Get('onboarding-status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Onboarding progress (GraphQL onboardingStatus equivalent)' })
  async onboardingStatus(@Req() req: AuthenticatedRequest) {
    const organizationId = req.user?.organizationId ?? null;

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

  @Get('is-email-verified')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Whether current user email is verified' })
  async isEmailVerified(@Req() req: AuthenticatedRequest) {
    const sessionUserId = (req.session as { user?: { id?: string } } | undefined)?.user?.id;
    const userId = req.user?.userId ?? sessionUserId;
    if (!userId) {
      throw new UnauthorizedException('No autenticado');
    }
    return this.authService.isEmailVerified(userId);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current user (GraphQL me equivalent)' })
  async me(@Req() req: AuthenticatedRequest) {
    const sessionUserId = (req.session as { user?: { id?: string } } | undefined)?.user?.id;
    const userId = req.user?.userId ?? sessionUserId;
    if (!userId) {
      throw new UnauthorizedException('No autenticado');
    }
    const user = await this.authService.getUser(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  @Patch('me/theme')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update theme preference' })
  async updateTheme(@Req() req: AuthenticatedRequest, @Body() body: { themePreference: string }) {
    const sessionUserId = (req.session as { user?: { id?: string } } | undefined)?.user?.id;
    const userId = req.user?.userId ?? sessionUserId;
    if (!userId) {
      throw new UnauthorizedException('No autenticado');
    }
    const valid = ['light', 'dark', 'system'].includes(body.themePreference);
    if (!valid) {
      throw new UnauthorizedException('themePreference must be light, dark, or system');
    }
    return this.authService.updateThemePreference(userId, body.themePreference);
  }

  @Post('create-school-with-organization')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create organization + school for onboarding (returns new JWT)' })
  async createSchoolWithOrganization(@Req() req: AuthenticatedRequest, @Body() input: CreateSchoolWithOrgInput) {
    const sessionUserId = (req.session as { user?: { id?: string } } | undefined)?.user?.id;
    const userId = req.user?.userId ?? sessionUserId;
    if (!userId) {
      throw new UnauthorizedException('No autenticado');
    }
    const result = await this.authService.createSchoolWithOrganization(userId, input);
    const accessToken = this.authService.generateJwt(result.user);
    return { accessToken, schoolId: result.school.id };
  }

  @Post('resend-invitation')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend invitation email for pending user' })
  async resendInvitation(@Body() body: { email: string }) {
    return this.authService.resendUserInvitation(body.email);
  }

  @Get('available-schools')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Schools available to join (search-only; requires a query of at least 3 chars)',
  })
  async availableSchools(@Query('query') query?: string) {
    const q = (query ?? '').trim();
    if (q.length < 3) {
      // Do not enumerate tenants; require a meaningful search term.
      return [];
    }
    const schools = await this.authService.getAvailableSchools(q);
    // Intentionally omit counts/PII to reduce cross-tenant disclosure.
    return schools.map((s) => ({
      id: s.id,
      name: s.name,
      shortName: s.shortName,
      organizationId: s.organizationId,
      logo: s.logo,
      city: s.city,
      country: s.country,
      organizationName: s.organization?.name || '',
    }));
  }

  @Post('request-join-school')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request to join a school' })
  async requestJoinSchool(@Req() req: AuthenticatedRequest, @Body() input: RequestJoinSchoolInput) {
    const sessionUserId = (req.session as { user?: { id?: string } } | undefined)?.user?.id;
    const userId = req.user?.userId ?? sessionUserId;
    if (!userId) {
      throw new UnauthorizedException('No autenticado');
    }
    return this.authService.requestJoinSchool(userId, input, { ip: this.clientIp(req) });
  }

  @Post('link-child')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link a parent account to a student via enrollment code (auto-link, no approval)' })
  async linkChild(@Req() req: AuthenticatedRequest, @Body() input: LinkChildInput) {
    const sessionUserId = (req.session as { user?: { id?: string } } | undefined)?.user?.id;
    const userId = req.user?.userId ?? sessionUserId;
    if (!userId) {
      throw new UnauthorizedException('No autenticado');
    }
    return this.authService.linkChildByCode(userId, input, { ip: this.clientIp(req) });
  }

  @Get('my-join-request-status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current user join request status' })
  async myJoinRequestStatus(@Req() req: AuthenticatedRequest) {
    const sessionUserId = (req.session as { user?: { id?: string } } | undefined)?.user?.id;
    const userId = req.user?.userId ?? sessionUserId;
    if (!userId) {
      return null;
    }
    const request = await this.authService.getMyJoinRequestStatus(userId);
    if (!request) {
      return null;
    }
    return {
      id: request.id,
      requestedRole: request.requestedRole,
      status: request.status,
      schoolName: request.school?.name || '',
      createdAt: request.createdAt,
    };
  }

  @Post('complete-onboarding')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark onboarding complete for organization' })
  async completeOnboarding(@Req() req: AuthenticatedRequest) {
    const organizationId = req.user?.organizationId ?? null;
    const sessionUserId = (req.session as { user?: { id?: string } } | undefined)?.user?.id;
    const userId = req.user?.userId ?? sessionUserId;
    if (!organizationId || !userId) {
      throw new UnauthorizedException('No se encontró una organización');
    }
    await this.authService.completeOnboarding(organizationId, userId);
    return true;
  }
}
