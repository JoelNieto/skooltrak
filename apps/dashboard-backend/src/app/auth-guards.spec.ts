import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
// Deep import on purpose: the `@/auth` barrel pulls in better-auth's ESM build, which this Jest
// setup can't parse (the reason most service specs here currently fail to load).
// eslint-disable-next-line @nx/enforce-module-boundaries
import {
  AuthenticatedRequest,
  BetterAuthGuard,
  IS_PUBLIC_KEY,
  PERMISSIONS_KEY,
  PermissionsGuard,
} from '../../../../libs/auth/src/lib/auth.guard';

// better-auth ships ESM that this Jest setup can't parse; the guards only re-export `Session`.
jest.mock('@thallesp/nestjs-better-auth', () => ({ Session: () => () => undefined }));
jest.mock('../../../../libs/auth/src/lib/prisma.service', () => ({ PrismaService: class {} }));

/**
 * BetterAuthGuard and PermissionsGuard run globally (APP_GUARD in libs/auth AuthModule),
 * so every route is authenticated unless marked @AllowAnonymous().
 */

function contextFor(
  request: Partial<AuthenticatedRequest>,
  metadata: Record<string, unknown> = {},
  type: 'http' | 'ws' = 'http',
): { context: ExecutionContext; reflector: Reflector } {
  const handler = () => undefined;
  const reflector = {
    getAllAndOverride: (key: string) => metadata[key],
  } as unknown as Reflector;
  const context = {
    getType: () => type,
    getHandler: () => handler,
    getClass: () => class TestController {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, reflector };
}

describe('BetterAuthGuard (global)', () => {
  const dbUser = {
    id: 'user-1',
    organizationId: 'org-1',
    role: { name: 'TEACHER', permissions: [{ descriptiveId: 'MANAGE_GRADES' }] },
  };
  const findUnique = jest.fn();
  const moduleRef = { get: () => ({ user: { findUnique } }) } as unknown as ModuleRef;

  beforeEach(() => {
    findUnique.mockReset();
    process.env['JWT_SECRET'] = 'test-secret';
  });

  it('rejects an anonymous request to an unannotated route', async () => {
    const { context, reflector } = contextFor({ headers: {} });
    await expect(new BetterAuthGuard(reflector, moduleRef).canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an invalid bearer token', async () => {
    const { context, reflector } = contextFor({ headers: { authorization: 'Bearer nope' } });
    await expect(new BetterAuthGuard(reflector, moduleRef).canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('allows routes marked @AllowAnonymous()', async () => {
    const { context, reflector } = contextFor({ headers: {} }, { [IS_PUBLIC_KEY]: true });
    await expect(new BetterAuthGuard(reflector, moduleRef).canActivate(context)).resolves.toBe(true);
  });

  it('authenticates a valid bearer token and populates req.user', async () => {
    findUnique.mockResolvedValue(dbUser);
    const token = jwt.sign({ userId: 'user-1' }, 'test-secret');
    const request: Partial<AuthenticatedRequest> = { headers: { authorization: `Bearer ${token}` } };
    const { context, reflector } = contextFor(request);

    await expect(new BetterAuthGuard(reflector, moduleRef).canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({
      userId: 'user-1',
      organizationId: 'org-1',
      role: 'TEACHER',
      permissions: ['MANAGE_GRADES'],
    });
  });

  it('skips the DB lookup when req.user was already set earlier in the request', async () => {
    const request: Partial<AuthenticatedRequest> = {
      headers: {},
      user: { userId: 'user-1', organizationId: 'org-1', role: 'TEACHER' },
    };
    const { context, reflector } = contextFor(request);

    await expect(new BetterAuthGuard(reflector, moduleRef).canActivate(context)).resolves.toBe(true);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('ignores WebSocket contexts (gateways authenticate in handleConnection)', async () => {
    const { context, reflector } = contextFor({}, {}, 'ws');
    await expect(new BetterAuthGuard(reflector, moduleRef).canActivate(context)).resolves.toBe(true);
  });
});

describe('PermissionsGuard (global)', () => {
  const teacher = { userId: 'u', organizationId: 'o', role: 'TEACHER', permissions: ['VIEW_GRADES'] };

  it('allows authenticated users when no permission is required', () => {
    const { context, reflector } = contextFor({ user: teacher });
    expect(new PermissionsGuard(reflector).canActivate(context)).toBe(true);
  });

  it('forbids users missing the required permission', () => {
    const { context, reflector } = contextFor({ user: teacher }, { [PERMISSIONS_KEY]: ['MANAGE_GRADES'] });
    expect(() => new PermissionsGuard(reflector).canActivate(context)).toThrow(ForbiddenException);
  });

  it('allows users holding one of the required permissions', () => {
    const { context, reflector } = contextFor(
      { user: teacher },
      { [PERMISSIONS_KEY]: ['MANAGE_GRADES', 'VIEW_GRADES'] },
    );
    expect(new PermissionsGuard(reflector).canActivate(context)).toBe(true);
  });

  it('ignores WebSocket contexts', () => {
    const { context, reflector } = contextFor({}, { [PERMISSIONS_KEY]: ['MANAGE_GRADES'] }, 'ws');
    expect(new PermissionsGuard(reflector).canActivate(context)).toBe(true);
  });
});
