import { Body, Controller, Get, Param, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AllowAnonymous, AuthenticatedRequest, RequireRoles, RoleGuard } from '../auth.guard';
import { AcceptOrgInvitationInput } from '../dto/accept-org-invitation.input';
import { CreateFirstSchoolInput } from '../dto/create-first-school.input';
import { CreateOrganizationWithInvitationInput } from '../organizations/dto/create-organization-with-invitation.input';
import { OrgOnboardingService } from './org-onboarding.service';

function clientIp(req: AuthenticatedRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  if (Array.isArray(fwd) && fwd.length > 0) return fwd[0].trim();
  return req.ip ?? 'unknown';
}

/**
 * IAM-001 console endpoints. Platform admins only: a `Perm.*` key cannot restrict these,
 * because PermissionsGuard lets ORG_ADMIN pass any permission check (BR .1).
 */
@ApiTags('organizations')
@Controller('v1/organizations')
@UseGuards(RoleGuard)
@RequireRoles('SYSADMIN')
export class OrgInvitationsAdminController {
  constructor(private readonly onboarding: OrgOnboardingService) {}

  @Post('with-invitation')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an organization and invite its first administrator (IAM-001)' })
  createWithInvitation(@Req() req: AuthenticatedRequest, @Body() input: CreateOrganizationWithInvitationInput) {
    const actorId = req.user?.userId;
    if (!actorId) throw new UnauthorizedException('No autenticado');
    return this.onboarding.createWithInvitation(actorId, input);
  }
}

/** IAM-001 invitee endpoints: preview and accept a link, then create the first school. */
@ApiTags('auth')
@Controller('v1/auth')
export class OrgInvitationsController {
  constructor(private readonly onboarding: OrgOnboardingService) {}

  @Get('org-invitations/:token')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Preview an organization invitation link (IAM-001)' })
  preview(@Param('token') token: string) {
    return this.onboarding.preview(token);
  }

  @Post('org-invitations/:token/accept')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Accept an organization invitation with a new account (returns JWT)' })
  accept(@Req() req: AuthenticatedRequest, @Param('token') token: string, @Body() input: AcceptOrgInvitationInput) {
    return this.onboarding.accept(token, input, clientIp(req));
  }

  @Post('setup/first-school')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create the first school of the caller's organization (IAM-001)" })
  createFirstSchool(@Req() req: AuthenticatedRequest, @Body() input: CreateFirstSchoolInput) {
    return this.onboarding.createFirstSchool(req.user, input);
  }
}
