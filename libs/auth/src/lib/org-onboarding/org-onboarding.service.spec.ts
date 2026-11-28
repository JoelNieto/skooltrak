import { ConflictException, ForbiddenException, GoneException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hashInvitationToken, orgInvitationState } from '../organizations/org-invitation-state';

// Keep better-auth / @generated/prisma out of the unit test.
vi.mock('../better-auth', () => ({ auth: { api: {} } }));
vi.mock('../prisma.service', () => ({ PrismaService: class {} }));
vi.mock('../resend.service', () => ({
  sendEmail: vi.fn(),
  sendUserInvitation: vi.fn(),
  sendMagicLinkEmail: vi.fn(),
  sendOrganizationInvitationEmail: vi.fn().mockResolvedValue({ data: { id: 'email-1' } }),
}));

import { sendOrganizationInvitationEmail } from '../resend.service';
import { OrgOnboardingService, orgInvitationLink } from './org-onboarding.service';

const FUTURE = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
const PAST = new Date(Date.now() - 60 * 1000);
const TOKEN = 'plain-token-abc';

function invitation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'inv-1',
    organizationId: 'org-1',
    email: 'acastillo@ibp.test',
    firstName: 'Ana',
    lastName: 'Castillo',
    tokenHash: hashInvitationToken(TOKEN),
    status: 'SENT',
    expiresAt: FUTURE,
    organization: { name: 'Instituto Bilingüe del Pacífico' },
    ...overrides,
  };
}

function makePrisma(state: { invitation?: any; existingUser?: any; schoolCount?: number; claimed?: number } = {}) {
  const prisma: any = {
    organization: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'org-1', ...data })),
    },
    permission: { findMany: vi.fn().mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]) },
    role: {
      create: vi.fn().mockResolvedValue({ id: 'role-admin', name: 'ORG_ADMIN', permissions: [] }),
      findFirst: vi.fn().mockResolvedValue({ id: 'role-admin', name: 'ORG_ADMIN' }),
    },
    organizationInvitation: {
      create: vi.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'inv-1', status: 'SENT', ...data })),
      findUnique: vi.fn().mockResolvedValue(state.invitation ?? null),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: state.claimed ?? 1 }),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue(state.existingUser ?? null),
      create: vi.fn().mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'user-1', ...data, role: { name: 'ORG_ADMIN', permissions: [] } }),
      ),
    },
    account: { create: vi.fn().mockResolvedValue({}) },
    member: { create: vi.fn().mockResolvedValue({}) },
    school: {
      count: vi.fn().mockResolvedValue(state.schoolCount ?? 0),
      create: vi.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'school-1', ...data })),
    },
    onboardingAuditLog: { create: vi.fn().mockResolvedValue({}) },
  };
  prisma.$transaction = vi.fn().mockImplementation((fn: any) => fn(prisma));
  return prisma;
}

function makeService(prisma: any) {
  const authService: any = { generateJwt: vi.fn().mockReturnValue('jwt-token') };
  return { service: new OrgOnboardingService(prisma, authService), authService };
}

const acceptInput = { firstName: 'Ana', lastName: 'Castillo', password: 'secreto123', acceptTerms: true };

describe('orgInvitationState (BR-IAM-001.5)', () => {
  it('derives EXPIRED from expiresAt and keeps terminal states', () => {
    expect(orgInvitationState({ status: 'SENT', expiresAt: FUTURE })).toBe('VALID');
    expect(orgInvitationState({ status: 'DELIVERY_FAILED', expiresAt: FUTURE })).toBe('VALID');
    expect(orgInvitationState({ status: 'SENT', expiresAt: PAST })).toBe('EXPIRED');
    expect(orgInvitationState({ status: 'ACCEPTED', expiresAt: PAST })).toBe('ACCEPTED');
    expect(orgInvitationState({ status: 'REVOKED', expiresAt: FUTURE })).toBe('REVOKED');
    expect(orgInvitationState({ status: 'SUPERSEDED', expiresAt: FUTURE })).toBe('SUPERSEDED');
  });
});

describe('OrgOnboardingService.createWithInvitation (FR-IAM-001.1, .2)', () => {
  beforeEach(() => vi.mocked(sendOrganizationInvitationEmail).mockClear());

  it('creates an empty organization, its ORG_ADMIN role and a hashed invitation, then emails the link', async () => {
    const prisma = makePrisma();
    const { service } = makeService(prisma);

    const result = await service.createWithInvitation('sysadmin-1', {
      name: ' Instituto Bilingüe del Pacífico ',
      description: 'Red de 2 sedes',
      admin: { firstName: 'Ana', lastName: 'Castillo', email: 'ACastillo@IBP.test ' },
    });

    expect(prisma.organization.create.mock.calls[0][0].data).toMatchObject({
      name: 'Instituto Bilingüe del Pacífico',
      slug: 'instituto-bilingue-del-pacifico',
      onboardingCompleted: false,
    });
    expect(prisma.school.create).not.toHaveBeenCalled();
    expect(prisma.role.create.mock.calls[0][0].data).toMatchObject({ name: 'ORG_ADMIN', organizationId: 'org-1' });

    const invData = prisma.organizationInvitation.create.mock.calls[0][0].data;
    expect(invData.email).toBe('acastillo@ibp.test');
    expect(invData.invitedById).toBe('sysadmin-1');
    expect(invData.tokenHash).toMatch(/^[0-9a-f]{64}$/);

    const email = vi.mocked(sendOrganizationInvitationEmail).mock.calls[0][0];
    expect(email.to).toBe('acastillo@ibp.test');
    const token = email.link.split('/invitacion/')[1];
    // BR .4: only the hash of the emailed token is stored.
    expect(hashInvitationToken(token)).toBe(invData.tokenHash);
    expect(invData).not.toHaveProperty('token');
    expect(result.invitation.state).toBe('VALID');
    expect(prisma.onboardingAuditLog.create.mock.calls[0][0].data.action).toBe('ORG_INVITATION_CREATED');
  });

  it('does not send the email when sendEmail is false', async () => {
    const prisma = makePrisma();
    const { service } = makeService(prisma);
    await service.createWithInvitation('sysadmin-1', {
      name: 'Escuela Las Cumbres',
      admin: { firstName: 'Carlos', lastName: 'Méndez', email: 'c@lc.test' },
      sendEmail: false,
    });
    expect(sendOrganizationInvitationEmail).not.toHaveBeenCalled();
  });

  it('records a failed send without failing the create', async () => {
    vi.mocked(sendOrganizationInvitationEmail).mockResolvedValueOnce({ error: { name: 'validation_error' } } as never);
    const prisma = makePrisma();
    const { service } = makeService(prisma);
    await service.createWithInvitation('sysadmin-1', {
      name: 'Academia Horizonte',
      admin: { firstName: 'Luis', lastName: 'Herrera', email: 'l@h.test' },
    });
    expect(prisma.organizationInvitation.update.mock.calls[0][0].data).toMatchObject({
      lastSendError: 'validation_error',
      sendAttempts: { increment: 1 },
    });
  });
});

describe('OrgOnboardingService.preview (FR-IAM-001.11)', () => {
  it('returns invitee details for a valid link', async () => {
    const { service } = makeService(makePrisma({ invitation: invitation() }));
    await expect(service.preview(TOKEN)).resolves.toMatchObject({
      state: 'VALID',
      organizationName: 'Instituto Bilingüe del Pacífico',
      email: 'acastillo@ibp.test',
      firstName: 'Ana',
    });
  });

  it('hides invitee details once the link is unusable', async () => {
    const { service } = makeService(makePrisma({ invitation: invitation({ expiresAt: PAST }) }));
    const preview = await service.preview(TOKEN);
    expect(preview.state).toBe('EXPIRED');
    expect(preview.email).toBeUndefined();
  });

  it('404s on an unknown token', async () => {
    const { service } = makeService(makePrisma());
    await expect(service.preview('nope')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('OrgOnboardingService.accept (FR-IAM-001.12)', () => {
  it('creates a verified ORG_ADMIN of the invited organization and returns a JWT', async () => {
    const prisma = makePrisma({ invitation: invitation() });
    const { service, authService } = makeService(prisma);

    await expect(service.accept(TOKEN, acceptInput, '1.1.1.1')).resolves.toEqual({ accessToken: 'jwt-token' });

    const userData = prisma.user.create.mock.calls[0][0].data;
    expect(userData).toMatchObject({
      email: 'acastillo@ibp.test',
      emailVerified: true,
      roleId: 'role-admin',
      organizationId: 'org-1',
      onboardingStep: 'school-setup',
    });
    expect(userData.password).not.toBe('secreto123');
    expect(prisma.role.findFirst.mock.calls[0][0].where).toEqual({ organizationId: 'org-1', name: 'ORG_ADMIN' });
    expect(prisma.member.create.mock.calls[0][0].data).toMatchObject({ organizationId: 'org-1', role: 'owner' });
    expect(prisma.organizationInvitation.updateMany.mock.calls[0][0].data.status).toBe('ACCEPTED');
    expect(authService.generateJwt).toHaveBeenCalled();
  });

  it.each([
    ['EXPIRED', { expiresAt: PAST }],
    ['ACCEPTED', { status: 'ACCEPTED' }],
    ['REVOKED', { status: 'REVOKED' }],
    ['SUPERSEDED', { status: 'SUPERSEDED' }],
  ])('refuses a %s link with 410 and creates no account', async (state, overrides) => {
    const prisma = makePrisma({ invitation: invitation(overrides) });
    const { service } = makeService(prisma);
    const error = await service.accept(TOKEN, acceptInput, '1.1.1.2').catch((e) => e);
    expect(error).toBeInstanceOf(GoneException);
    expect(error.getResponse()).toMatchObject({ statusCode: 410, state });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('refuses a second acceptance that loses the race for the link', async () => {
    const prisma = makePrisma({ invitation: invitation(), claimed: 0 });
    const { service } = makeService(prisma);
    const error = await service.accept(TOKEN, acceptInput, '1.1.1.3').catch((e) => e);
    expect(error).toBeInstanceOf(GoneException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('refuses an email that already has an account (existing-account accept is IAM-001-S05)', async () => {
    const prisma = makePrisma({ invitation: invitation(), existingUser: { id: 'u-old' } });
    const { service } = makeService(prisma);
    await expect(service.accept(TOKEN, acceptInput, '1.1.1.4')).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('OrgOnboardingService.createFirstSchool (FR-IAM-001.15)', () => {
  const admin = { userId: 'user-1', organizationId: 'org-1', role: 'ORG_ADMIN' };

  it("creates the school in the caller's organization", async () => {
    const prisma = makePrisma();
    const { service } = makeService(prisma);
    await service.createFirstSchool(admin, { name: 'Instituto Bilingüe del Pacífico', shortName: 'IBP' });
    expect(prisma.school.create.mock.calls[0][0].data).toMatchObject({ organizationId: 'org-1', shortName: 'IBP' });
    expect(prisma.organization.create).not.toHaveBeenCalled();
  });

  it('refuses when the organization already has a school (409)', async () => {
    const { service } = makeService(makePrisma({ schoolCount: 1 }));
    await expect(service.createFirstSchool(admin, { name: 'X', shortName: 'X' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it.each([
    ['a teacher', { userId: 'u', organizationId: 'org-1', role: 'TEACHER' }],
    ['a user without organization', { userId: 'u', organizationId: null, role: 'ORG_ADMIN' }],
    ['an anonymous caller', undefined],
  ])('refuses %s (403)', async (_label, caller) => {
    const { service } = makeService(makePrisma());
    await expect(service.createFirstSchool(caller as never, { name: 'X', shortName: 'X' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

describe('orgInvitationLink', () => {
  it('points at the dashboard accept route', () => {
    process.env['DASHBOARD_URL'] = 'https://app.skooltrak.com/';
    expect(orgInvitationLink('abc')).toBe('https://app.skooltrak.com/invitacion/abc');
    delete process.env['DASHBOARD_URL'];
  });
});
