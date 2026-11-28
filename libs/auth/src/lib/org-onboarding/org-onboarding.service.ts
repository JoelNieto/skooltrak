import {
  ConflictException,
  ForbiddenException,
  GoneException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { AuthService } from '../auth.service';
import type { AuthUserContext } from '../auth.guard';
import { AcceptOrgInvitationInput } from '../dto/accept-org-invitation.input';
import { CreateFirstSchoolInput } from '../dto/create-first-school.input';
import { OnboardingStep, assertTransition } from '../onboarding-step';
import { CreateOrganizationWithInvitationInput } from '../organizations/dto/create-organization-with-invitation.input';
import { createOrgAdminRole, slugify } from '../organizations/org-admin-role';
import {
  OrgInvitationState,
  hashInvitationToken,
  newInvitationToken,
  orgInvitationState,
} from '../organizations/org-invitation-state';
import { PrismaService } from '../prisma.service';
import { RateLimiter } from '../rate-limiter';
import { sendOrganizationInvitationEmail } from '../resend.service';

/** FR .3 default lifetime of an invitation link. */
export const ORG_INVITATION_TTL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
const ACCEPT_LIMIT = 20;
const ACCEPT_WINDOW_MS = 15 * 60 * 1000;

const STATE_MESSAGES: Record<Exclude<OrgInvitationState, 'VALID'>, string> = {
  EXPIRED: 'Esta invitación venció',
  REVOKED: 'Este enlace ya no es válido',
  SUPERSEDED: 'Este enlace ya no es válido',
  ACCEPTED: 'Ya aceptaste esta invitación',
};

export interface OrgInvitationPreview {
  state: OrgInvitationState;
  organizationName: string;
  /** Invitee details are only returned while the link is usable. */
  firstName?: string;
  lastName?: string;
  email?: string;
  expiresAt?: Date;
}

/** Link to the invitee's accept page in web-dashboard. */
export function orgInvitationLink(token: string): string {
  const base = process.env['DASHBOARD_URL'] || process.env['APP_URL'] || 'http://localhost:4200';
  return `${base.replace(/\/$/, '')}/invitacion/${token}`;
}

/**
 * IAM-001: organization onboarding by invitation.
 * Platform admins create an organization with its first admin invitation; the invitee
 * accepts with a single-use link and creates the organization's first school.
 */
@Injectable()
export class OrgOnboardingService {
  private readonly rateLimiter = new RateLimiter();

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  /** FR .1–.2 (SYSADMIN): create the empty organization, its ORG_ADMIN role and the invitation. */
  async createWithInvitation(actorId: string, input: CreateOrganizationWithInvitationInput) {
    const email = input.admin.email.trim().toLowerCase();
    const name = input.name.trim();
    const slug = await this.uniqueSlug(name);
    const { token, tokenHash } = newInvitationToken();
    const expiresAt = new Date(Date.now() + ORG_INVITATION_TTL_DAYS * DAY_MS);

    const { organization, invitation } = await this.prisma.$transaction(async (tx) => {
      // BR .11: no school, onboarding not completed.
      const organization = await tx.organization.create({
        data: { name, slug, description: input.description?.trim() ?? '', active: true, onboardingCompleted: false },
      });
      await createOrgAdminRole(tx, organization.id);
      const invitation = await tx.organizationInvitation.create({
        data: {
          organizationId: organization.id,
          email,
          firstName: input.admin.firstName.trim(),
          lastName: input.admin.lastName.trim(),
          tokenHash,
          expiresAt,
          invitedById: actorId,
        },
      });
      return { organization, invitation };
    });

    await this.audit('ORG_INVITATION_CREATED', { actorId, organizationId: organization.id });

    if (input.sendEmail !== false) {
      await this.deliver(invitation.id, { to: email, firstName: invitation.firstName, organizationName: name, token, expiresAt });
    }

    return {
      organizationId: organization.id,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        state: orgInvitationState(invitation),
        expiresAt: invitation.expiresAt,
      },
    };
  }

  /** FR .11 / .14: what the accept page shows for a link. Unknown tokens are 404. */
  async preview(token: string): Promise<OrgInvitationPreview> {
    const invitation = await this.findByToken(token);
    const state = orgInvitationState(invitation);
    const base = { state, organizationName: invitation.organization.name };
    if (state !== 'VALID') return base;
    return {
      ...base,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      email: invitation.email,
      expiresAt: invitation.expiresAt,
    };
  }

  /** FR .11–.12: create the invitee's account as ORG_ADMIN of the invited organization. */
  async accept(token: string, input: AcceptOrgInvitationInput, ip?: string) {
    const limit = this.rateLimiter.hit(`org-invite:${ip ?? 'unknown'}`, ACCEPT_LIMIT, ACCEPT_WINDOW_MS);
    if (!limit.allowed) {
      throw new HttpException('Demasiados intentos. Intenta de nuevo más tarde.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const invitation = await this.findByToken(token);
    this.assertUsable(orgInvitationState(invitation));

    const existing = await this.prisma.user.findUnique({ where: { email: invitation.email } });
    if (existing) {
      // Existing accounts accept by signing in (IAM-001-S05); not supported yet.
      throw new ConflictException('Este correo ya tiene una cuenta');
    }

    // Invitee accounts start at school setup (`null → school-setup` is an allowed transition).
    assertTransition(null, OnboardingStep.SCHOOL_SETUP);
    const hashedPassword = await bcrypt.hash(input.password, 10);
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();

    const user = await this.prisma.$transaction(async (tx) => {
      // Claim the invitation atomically so a link can only be used once.
      const claimed = await tx.organizationInvitation.updateMany({
        where: { id: invitation.id, status: { in: ['SENT', 'DELIVERY_FAILED'] }, expiresAt: { gt: new Date() } },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      });
      if (claimed.count === 0) {
        throw this.goneFor('ACCEPTED');
      }

      const role = await tx.role.findFirst({
        where: { organizationId: invitation.organizationId, name: 'ORG_ADMIN' },
      });
      if (!role) throw new NotFoundException('La organización no tiene un rol de administrador');

      const created = await tx.user.create({
        data: {
          email: invitation.email,
          name: `${firstName} ${lastName}`.trim(),
          firstName,
          lastName,
          password: hashedPassword,
          color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 80%)`,
          emailVerified: true, // BR .12: the link proved ownership of the address.
          roleId: role.id,
          organizationId: invitation.organizationId,
          onboardingStep: OnboardingStep.SCHOOL_SETUP,
        },
        include: { role: { include: { permissions: true } } },
      });
      await tx.account.create({
        data: { id: randomUUID(), accountId: created.id, providerId: 'credential', userId: created.id, password: hashedPassword },
      });
      await tx.member.create({
        data: { id: randomUUID(), organizationId: invitation.organizationId, userId: created.id, role: 'owner' },
      });
      await tx.organizationInvitation.update({ where: { id: invitation.id }, data: { acceptedByUserId: created.id } });
      return created;
    });

    await this.audit('ORG_INVITATION_ACCEPTED', {
      actorId: user.id,
      userId: user.id,
      organizationId: invitation.organizationId,
      ip,
    });

    return { accessToken: this.authService.generateJwt(user) };
  }

  /** FR .15: the first school of the caller's (invited) organization. */
  async createFirstSchool(caller: AuthUserContext | undefined, input: CreateFirstSchoolInput) {
    const role = caller?.role?.toUpperCase();
    if (!caller?.organizationId || (role !== 'ORG_ADMIN' && role !== 'ADMIN')) {
      throw new ForbiddenException('Solo el administrador de la organización puede crear su primera escuela');
    }
    const organizationId = caller.organizationId;

    const existing = await this.prisma.school.count({ where: { organizationId } });
    if (existing > 0) {
      throw new ConflictException('La organización ya tiene escuelas');
    }

    return this.prisma.school.create({
      data: {
        name: input.name.trim(),
        shortName: input.shortName.trim(),
        organizationId,
        currentYear: input.currentYear ?? new Date().getFullYear(),
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
  }

  // ---------------------------------------------------------------------------

  private async findByToken(token: string) {
    const invitation = token
      ? await this.prisma.organizationInvitation.findUnique({
          where: { tokenHash: hashInvitationToken(token) },
          include: { organization: { select: { name: true } } },
        })
      : null;
    if (!invitation) {
      throw new NotFoundException('Este enlace ya no es válido');
    }
    return invitation;
  }

  private assertUsable(state: OrgInvitationState) {
    if (state !== 'VALID') throw this.goneFor(state);
  }

  /** BR .5: 410 with the state code that drives the accept page's unusable-link states. */
  private goneFor(state: Exclude<OrgInvitationState, 'VALID'>) {
    return new GoneException({ statusCode: HttpStatus.GONE, state, message: STATE_MESSAGES[state] });
  }

  private async deliver(
    invitationId: string,
    params: { to: string; firstName: string; organizationName: string; token: string; expiresAt: Date },
  ) {
    let error: string | null = null;
    try {
      const result = await sendOrganizationInvitationEmail({
        to: params.to,
        firstName: params.firstName,
        organizationName: params.organizationName,
        link: orgInvitationLink(params.token),
        expiresAt: params.expiresAt,
      });
      if (result?.error) error = result.error.name ?? 'send_failed';
    } catch (e) {
      error = e instanceof Error ? e.name : 'send_failed';
    }
    // S01: the failure is recorded; surfacing DELIVERY_FAILED in the console is IAM-001-S04.
    await this.prisma.organizationInvitation.update({
      where: { id: invitationId },
      data: {
        sendAttempts: { increment: 1 },
        ...(error ? { lastSendError: error } : { sentAt: new Date(), lastSendError: null }),
      },
    });
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || 'organizacion';
    let slug = base;
    for (let i = 1; await this.prisma.organization.findFirst({ where: { slug }, select: { id: true } }); i++) {
      slug = `${base}-${i}`;
    }
    return slug;
  }

  private async audit(
    action: 'ORG_INVITATION_CREATED' | 'ORG_INVITATION_ACCEPTED',
    params: { actorId?: string; userId?: string; organizationId?: string; ip?: string },
  ) {
    await this.prisma.onboardingAuditLog.create({
      data: {
        action,
        actorId: params.actorId ?? null,
        userId: params.userId ?? null,
        organizationId: params.organizationId ?? null,
        ip: params.ip ?? null,
      },
    });
  }
}
