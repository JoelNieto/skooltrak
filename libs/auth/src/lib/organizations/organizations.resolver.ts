import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AllowAnonymous, BetterAuthGuard } from '../auth.guard';
import { auth as betterAuthInstance } from '../better-auth';
import { CreateOrganizationInput } from './dto/create-organization.input';
import { UpdateOrganizationInput } from './dto/update-organization.input';
import { Invitation, Member } from './entities/invitation.entity';
import { Organization } from './entities/organization.entity';
import { OrganizationsService } from './organizations.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const authApi = (betterAuthInstance as any).api;

@Resolver(() => Organization)
@UseGuards(BetterAuthGuard)
export class OrganizationsResolver {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Mutation(() => Organization)
  createOrganization(
    @Args('createOrganizationInput')
    createOrganizationInput: CreateOrganizationInput
  ) {
    return this.organizationsService.create(createOrganizationInput);
  }

  @Query(() => [Organization], { name: 'organizations' })
  findAll() {
    return this.organizationsService.findAll();
  }

  @Query(() => Organization, { name: 'organization' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.organizationsService.findOne(id);
  }

  @Mutation(() => Organization)
  updateOrganization(
    @Args('updateOrganizationInput')
    updateOrganizationInput: UpdateOrganizationInput
  ) {
    return this.organizationsService.update(
      updateOrganizationInput.id,
      updateOrganizationInput
    );
  }

  @Mutation(() => Organization)
  removeOrganization(@Args('id', { type: () => String }) id: string) {
    return this.organizationsService.remove(id);
  }

  // ==========================================
  // Invitation Management
  // ==========================================

  @Mutation(() => Invitation)
  async inviteMember(
    @Args('email') email: string,
    @Args('role') role: string,
    @Args('organizationId', { nullable: true }) organizationId: string | null,
    @Context() context: any
  ): Promise<Invitation> {
    const headers = new Headers();
    const cookies = context.req.headers.cookie;
    if (cookies) {
      headers.set('cookie', cookies);
    }

    // Map role string to valid organization role
    const validRole = (['member', 'admin', 'owner'] as const).includes(
      role as 'member' | 'admin' | 'owner'
    )
      ? (role as 'member' | 'admin' | 'owner')
      : 'member';

    const response = await authApi.createInvitation({
      body: {
        email,
        role: validRole,
        organizationId: organizationId || undefined,
      },
      headers,
    });

    return response as Invitation;
  }

  @Query(() => [Invitation])
  async listInvitations(
    @Args('organizationId', { nullable: true }) organizationId: string | null,
    @Context() context: any
  ): Promise<Invitation[]> {
    const headers = new Headers();
    const cookies = context.req.headers.cookie;
    if (cookies) {
      headers.set('cookie', cookies);
    }

    const response = await authApi.listInvitations({
      query: { organizationId: organizationId || undefined },
      headers,
    });

    return (response as Invitation[]) || [];
  }

  @Mutation(() => Boolean)
  async cancelInvitation(
    @Args('invitationId') invitationId: string,
    @Context() context: any
  ): Promise<boolean> {
    const headers = new Headers();
    const cookies = context.req.headers.cookie;
    if (cookies) {
      headers.set('cookie', cookies);
    }

    await authApi.cancelInvitation({
      body: { invitationId },
      headers,
    });

    return true;
  }

  @Mutation(() => Boolean)
  @AllowAnonymous()
  async acceptInvitation(
    @Args('invitationId') invitationId: string,
    @Context() context: any
  ): Promise<boolean> {
    const headers = new Headers();
    const cookies = context.req.headers.cookie;
    if (cookies) {
      headers.set('cookie', cookies);
    }

    await authApi.acceptInvitation({
      body: { invitationId },
      headers,
    });

    return true;
  }

  @Mutation(() => Boolean)
  @AllowAnonymous()
  async rejectInvitation(
    @Args('invitationId') invitationId: string,
    @Context() context: any
  ): Promise<boolean> {
    const headers = new Headers();
    const cookies = context.req.headers.cookie;
    if (cookies) {
      headers.set('cookie', cookies);
    }

    await authApi.rejectInvitation({
      body: { invitationId },
      headers,
    });

    return true;
  }

  // ==========================================
  // Member Management
  // ==========================================

  @Query(() => [Member])
  async listMembers(
    @Args('organizationId', { nullable: true }) organizationId: string | null,
    @Context() context: any
  ): Promise<Member[]> {
    const headers = new Headers();
    const cookies = context.req.headers.cookie;
    if (cookies) {
      headers.set('cookie', cookies);
    }

    const response = await authApi.listMembers({
      query: { organizationId: organizationId || undefined },
      headers,
    });

    // Extract members array from response
    const members = (response as any)?.members || [];
    return members.map((m: any) => ({
      id: m.id,
      organizationId: m.organizationId,
      userId: m.userId,
      role: m.role,
      createdAt: m.createdAt,
    })) as Member[];
  }

  @Mutation(() => Boolean)
  async removeMember(
    @Args('memberIdOrEmail') memberIdOrEmail: string,
    @Args('organizationId', { nullable: true }) organizationId: string | null,
    @Context() context: any
  ): Promise<boolean> {
    const headers = new Headers();
    const cookies = context.req.headers.cookie;
    if (cookies) {
      headers.set('cookie', cookies);
    }

    await authApi.removeMember({
      body: {
        memberIdOrEmail,
        organizationId: organizationId || undefined,
      },
      headers,
    });

    return true;
  }

  @Mutation(() => Boolean)
  async updateMemberRole(
    @Args('memberId') memberId: string,
    @Args('role') role: string,
    @Args('organizationId', { nullable: true }) organizationId: string | null,
    @Context() context: any
  ): Promise<boolean> {
    const headers = new Headers();
    const cookies = context.req.headers.cookie;
    if (cookies) {
      headers.set('cookie', cookies);
    }

    await authApi.updateMemberRole({
      body: {
        memberId,
        role,
        organizationId: organizationId || undefined,
      },
      headers,
    });

    return true;
  }

  // ==========================================
  // Organization Switching
  // ==========================================

  @Mutation(() => Boolean)
  async setActiveOrganization(
    @Args('organizationId', { nullable: true }) organizationId: string | null,
    @Context() context: any
  ): Promise<boolean> {
    const headers = new Headers();
    const cookies = context.req.headers.cookie;
    if (cookies) {
      headers.set('cookie', cookies);
    }

    await authApi.setActiveOrganization({
      body: { organizationId },
      headers,
    });

    return true;
  }
}
