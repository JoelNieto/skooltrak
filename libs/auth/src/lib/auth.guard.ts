import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { SetMetadata } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Decorator to mark routes as public (no auth required)
export const IS_PUBLIC_KEY = 'isPublic';
export const AllowAnonymous = () => SetMetadata(IS_PUBLIC_KEY, true);
export const Public = AllowAnonymous;

// Re-export Session decorator from nestjs-better-auth
export { Session, UserSession } from '@thallesp/nestjs-better-auth';

/**
 * Interface for the user context expected by services
 * This maintains backward compatibility with the old JWT payload
 */
export interface AuthUserContext {
  userId: string;
  organizationId: string | null;
  role: string;
  permissions?: string[];
}

/**
 * Auth guard that works with better-auth sessions via GraphQL context
 * This guard checks for the session in the GraphQL context set by better-auth
 * and populates req.user with the expected fields for backward compatibility
 */
@Injectable()
export class BetterAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

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

    // Check for session from better-auth or legacy JWT user
    const session = request.session;
    const legacyUser = request.user;

    // If we have a better-auth session, populate req.user for backward compatibility
    if (session?.user) {
      const user = session.user;
      request.user = {
        userId: user.id,
        organizationId: session.activeOrganizationId || user.organizationId || null,
        role: user.role?.name || 'member',
        permissions: user.role?.permissions?.map((p: any) => p.descriptiveId) || [],
      } as AuthUserContext;
      return true;
    }

    // If we have a legacy JWT user object, it's already in the expected format
    if (legacyUser?.userId) {
      return true;
    }

    throw new UnauthorizedException('Not authenticated');
  }
}

/**
 * @deprecated Use BetterAuthGuard instead
 * Legacy JWT guard for backward compatibility during migration
 */
export class JwtAuthGuard extends BetterAuthGuard {}

/**
 * Guard to check if user has a specific role
 */
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly allowedRoles: string[]
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    const user = request.user as AuthUserContext;

    if (!user?.userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    return this.allowedRoles.some(
      (role) => user.role?.toUpperCase() === role.toUpperCase()
    );
  }
}

/**
 * Guard to check if user is a teacher
 */
@Injectable()
export class TeacherGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    const user = request.user as AuthUserContext;

    if (!user?.userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    return user.role?.toUpperCase() === 'TEACHER';
  }
}

/**
 * Guard to check if user is an admin
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    const user = request.user as AuthUserContext;

    if (!user?.userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    const role = user.role?.toUpperCase();
    return role === 'ADMIN' || role === 'ORG_ADMIN' || role === 'OWNER';
  }
}
