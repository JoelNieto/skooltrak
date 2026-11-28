import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../better-auth', () => ({ auth: { api: {} } }));
vi.mock('../prisma.service', () => ({ PrismaService: class {} }));
vi.mock('../resend.service', () => ({}));

import { IS_PUBLIC_KEY, RoleGuard } from '../auth.guard';
import { OrgInvitationsAdminController, OrgInvitationsController } from './org-onboarding.controller';

function contextFor(handler: (...args: never[]) => unknown, cls: object, user?: Record<string, unknown>) {
  return {
    getHandler: () => handler,
    getClass: () => cls,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as never;
}

describe('IAM-001 console endpoints are SYSADMIN-only (BR-IAM-001.1)', () => {
  const guard = new RoleGuard(new Reflector());
  const handler = OrgInvitationsAdminController.prototype.createWithInvitation;

  it('applies RoleGuard to the controller', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, OrgInvitationsAdminController)).toContain(RoleGuard);
  });

  it('lets a SYSADMIN create an organization with an invitation', () => {
    const ctx = contextFor(handler, OrgInvitationsAdminController, { userId: 's', role: 'SYSADMIN', organizationId: null });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it.each(['ORG_ADMIN', 'ADMIN', 'TEACHER', 'member'])('refuses %s with 403', (role) => {
    const ctx = contextFor(handler, OrgInvitationsAdminController, { userId: 'u', role, organizationId: 'org-1' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('refuses an unauthenticated caller', () => {
    const ctx = contextFor(handler, OrgInvitationsAdminController, undefined);
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});

describe('IAM-001 invitee endpoints', () => {
  const reflector = new Reflector();

  it('preview and accept are public; first-school requires authentication', () => {
    const p = OrgInvitationsController.prototype;
    expect(reflector.get(IS_PUBLIC_KEY, p.preview)).toBe(true);
    expect(reflector.get(IS_PUBLIC_KEY, p.accept)).toBe(true);
    expect(reflector.get(IS_PUBLIC_KEY, p.createFirstSchool)).toBeUndefined();
  });
});
