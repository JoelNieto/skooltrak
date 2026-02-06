import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from './prisma.service';

// ---------------------------------------------------------------------------
// Decorator: mark routes as public (no auth required)
// ---------------------------------------------------------------------------
export const IS_PUBLIC_KEY = 'isPublic';
export const AllowAnonymous = () => SetMetadata(IS_PUBLIC_KEY, true);
export const Public = AllowAnonymous;

// ---------------------------------------------------------------------------
// Decorator: require specific permissions (OR logic – any match passes)
// ---------------------------------------------------------------------------
export const PERMISSIONS_KEY = 'requiredPermissions';
export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

// ---------------------------------------------------------------------------
// Decorator: require specific roles (OR logic – any match passes)
// ---------------------------------------------------------------------------
export const ROLES_KEY = 'requiredRoles';
export const RequireRoles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// Re-export Session decorator from nestjs-better-auth
export { Session, UserSession } from '@thallesp/nestjs-better-auth';

/**
 * Interface for the user context expected by services.
 * This maintains backward compatibility with the old JWT payload.
 */
export interface AuthUserContext {
  userId: string;
  organizationId: string | null;
  role: string;
  permissions?: string[];
}

interface JwtPayload {
  userId: string;
  role: string;
  organizationId: string | null;
  permissions: string[];
}

// ---------------------------------------------------------------------------
// BetterAuthGuard – authenticates user and populates req.user
// ---------------------------------------------------------------------------
@Injectable()
export class BetterAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private moduleRef: ModuleRef,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;

    // Check for session from better-auth
    const session = request.session;

    // If we have a better-auth session, populate req.user
    if (session?.user) {
      const sessionUser = session.user;
      const prisma = this.moduleRef.get(PrismaService, { strict: false });
      const dbUser = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        include: {
          role: { include: { permissions: true } },
        },
      });

      if (!dbUser) {
        throw new UnauthorizedException('User not found');
      }

      request.user = {
        userId: dbUser.id,
        organizationId: session.activeOrganizationId || dbUser.organizationId,
        role: dbUser.role?.name || 'member',
        permissions: dbUser.role?.permissions?.map((p) => p.descriptiveId) || [],
      } as AuthUserContext;

      return true;
    }

    // Check for JWT token in Authorization header (backward compatibility)
    const authHeader = request.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env['JWT_SECRET'] || '') as JwtPayload;

        // Fetch fresh user data from database
        const prisma = this.moduleRef.get(PrismaService, { strict: false });
        const dbUser = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: {
            role: { include: { permissions: true } },
          },
        });

        if (!dbUser) {
          throw new UnauthorizedException('User not found');
        }

        request.user = {
          userId: dbUser.id,
          organizationId: dbUser.organizationId,
          role: dbUser.role?.name || 'member',
          permissions: dbUser.role?.permissions?.map((p) => p.descriptiveId) || [],
        } as AuthUserContext;

        return true;
      } catch {
        throw new UnauthorizedException('Invalid token');
      }
    }

    throw new UnauthorizedException('Not authenticated');
  }
}

/**
 * @deprecated Use BetterAuthGuard instead
 * Legacy JWT guard for backward compatibility during migration
 */
export class JwtAuthGuard extends BetterAuthGuard {}

// ---------------------------------------------------------------------------
// PermissionsGuard – checks @RequirePermissions() metadata
// ---------------------------------------------------------------------------
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No permissions required – allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    const user = request.user as AuthUserContext;

    if (!user?.userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    const userPermissions = user.permissions ?? [];

    // OR logic: user needs at least one of the required permissions
    const hasPermission = requiredPermissions.some((perm) => userPermissions.includes(perm));

    if (!hasPermission) {
      throw new ForbiddenException('You do not have the required permissions to perform this action');
    }

    return true;
  }
}

// ---------------------------------------------------------------------------
// RoleGuard – checks @RequireRoles() metadata
// ---------------------------------------------------------------------------
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No roles required – allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    const user = request.user as AuthUserContext;

    if (!user?.userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    const hasRole = requiredRoles.some((role) => user.role?.toUpperCase() === role.toUpperCase());

    if (!hasRole) {
      throw new ForbiddenException('You do not have the required role to perform this action');
    }

    return true;
  }
}
