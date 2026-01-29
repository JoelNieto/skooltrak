import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { SetMetadata } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
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

interface JwtPayload {
  userId: string;
  role: string;
  organizationId: string | null;
  permissions: string[];
}

/**
 * Auth guard that works with better-auth sessions via GraphQL context
 * This guard checks for the session in the GraphQL context set by better-auth
 * and populates req.user with the expected fields for backward compatibility
 */
@Injectable()
export class BetterAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private moduleRef: ModuleRef
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
        const decoded = jwt.verify(
          token,
          process.env['JWT_SECRET'] || ''
        ) as JwtPayload;

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
      } catch (err) {
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
