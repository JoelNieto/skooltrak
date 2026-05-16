import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AllowAnonymous, BetterAuthGuard } from '../auth.guard';
import { auth as betterAuthInstance } from '../better-auth';
import { CreateOrganizationInput } from './dto/create-organization.input';
import { UpdateOrganizationInput } from './dto/update-organization.input';
import { Invitation, Member } from './entities/invitation.entity';
import { OrganizationsService } from './organizations.service';
import { Request } from 'express';

/** Organization plugin methods are not always inferred on `auth.api` across better-auth versions. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const authApi = (betterAuthInstance as any).api;

@ApiTags('organizations')
@Controller('v1/organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create organization' })
  create(@Body() createOrganizationInput: CreateOrganizationInput) {
    return this.organizationsService.create(createOrganizationInput);
  }

  @Get()
  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List organizations' })
  findAll() {
    return this.organizationsService.findAll();
  }

  @Get('invitations')
  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List invitations' })
  async listInvitations(
    @Req() req: Request,
    @Query('organizationId') organizationId: string | null,
  ): Promise<Invitation[]> {
    const headers = new Headers();
    const cookies = req.headers.cookie;
    if (cookies) headers.set('cookie', cookies);
    const response = await authApi.listInvitations({
      query: { organizationId: organizationId || undefined },
      headers,
    });
    return (response as Invitation[]) || [];
  }

  @Get('members')
  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List members' })
  async listMembers(
    @Req() req: Request,
    @Query('organizationId') organizationId: string | null,
  ): Promise<Member[]> {
    const headers = new Headers();
    const cookies = req.headers.cookie;
    if (cookies) headers.set('cookie', cookies);
    const response = await authApi.listMembers({
      query: { organizationId: organizationId || undefined },
      headers,
    });
    const members = (response as { members?: Member[] })?.members || [];
    return members.map((m: Member & Record<string, unknown>) => ({
      id: m.id,
      organizationId: m.organizationId,
      userId: m.userId,
      role: m.role,
      createdAt: m.createdAt,
    })) as Member[];
  }

  @Post('invite')
  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite member' })
  async inviteMember(
    @Req() req: Request,
    @Body() body: { email: string; role: string; organizationId?: string | null },
  ): Promise<Invitation> {
    const headers = new Headers();
    const cookies = req.headers.cookie;
    if (cookies) headers.set('cookie', cookies);
    const role = body.role;
    const validRole = (['member', 'admin', 'owner'] as const).includes(role as 'member' | 'admin' | 'owner')
      ? (role as 'member' | 'admin' | 'owner')
      : 'member';
    const response = await authApi.createInvitation({
      body: {
        email: body.email,
        role: validRole,
        organizationId: body.organizationId || undefined,
      },
      headers,
    });
    return response as Invitation;
  }

  @Post('invitations/:invitationId/cancel')
  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel invitation' })
  async cancelInvitation(@Req() req: Request, @Param('invitationId') invitationId: string): Promise<boolean> {
    const headers = new Headers();
    const cookies = req.headers.cookie;
    if (cookies) headers.set('cookie', cookies);
    await authApi.cancelInvitation({ body: { invitationId }, headers });
    return true;
  }

  @Post('invitations/:invitationId/accept')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Accept invitation' })
  async acceptInvitation(@Req() req: Request, @Param('invitationId') invitationId: string): Promise<boolean> {
    const headers = new Headers();
    const cookies = req.headers.cookie;
    if (cookies) headers.set('cookie', cookies);
    await authApi.acceptInvitation({ body: { invitationId }, headers });
    return true;
  }

  @Post('invitations/:invitationId/reject')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Reject invitation' })
  async rejectInvitation(@Req() req: Request, @Param('invitationId') invitationId: string): Promise<boolean> {
    const headers = new Headers();
    const cookies = req.headers.cookie;
    if (cookies) headers.set('cookie', cookies);
    await authApi.rejectInvitation({ body: { invitationId }, headers });
    return true;
  }

  @Post('members/remove')
  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove member' })
  async removeMember(
    @Req() req: Request,
    @Body() body: { memberIdOrEmail: string; organizationId?: string | null },
  ): Promise<boolean> {
    const headers = new Headers();
    const cookies = req.headers.cookie;
    if (cookies) headers.set('cookie', cookies);
    await authApi.removeMember({
      body: {
        memberIdOrEmail: body.memberIdOrEmail,
        organizationId: body.organizationId || undefined,
      },
      headers,
    });
    return true;
  }

  @Post('members/role')
  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update member role' })
  async updateMemberRole(
    @Req() req: Request,
    @Body() body: { memberId: string; role: string; organizationId?: string | null },
  ): Promise<boolean> {
    const headers = new Headers();
    const cookies = req.headers.cookie;
    if (cookies) headers.set('cookie', cookies);
    await authApi.updateMemberRole({
      body: {
        memberId: body.memberId,
        role: body.role,
        organizationId: body.organizationId || undefined,
      },
      headers,
    });
    return true;
  }

  @Post('active')
  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set active organization' })
  async setActiveOrganization(
    @Req() req: Request,
    @Body() body: { organizationId?: string | null },
  ): Promise<boolean> {
    const headers = new Headers();
    const cookies = req.headers.cookie;
    if (cookies) headers.set('cookie', cookies);
    await authApi.setActiveOrganization({
      body: { organizationId: body.organizationId },
      headers,
    });
    return true;
  }

  @Get(':id')
  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get organization by id' })
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Patch()
  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update organization' })
  update(@Body() updateOrganizationInput: UpdateOrganizationInput) {
    return this.organizationsService.update(updateOrganizationInput.id, updateOrganizationInput);
  }

  @Delete(':id')
  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete organization' })
  remove(@Param('id') id: string) {
    return this.organizationsService.remove(id);
  }
}
