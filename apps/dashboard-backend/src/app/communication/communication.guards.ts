import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthenticatedRequest } from '@/auth';

/**
 * Enforces that only staff/teacher/admin roles may initiate communication
 * (create threads, add participants). Parents and students are reply-only.
 *
 * This is a server-side guard — untrusted clients cannot bypass it via the UI.
 */
@Injectable()
export class CanInitiateGuard implements CanActivate {
  private static readonly REPLY_ONLY_ROLES = ['PARENT', 'STUDENT'];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user?.userId) {
      throw new ForbiddenException('Not authenticated');
    }

    const role = user.role?.toUpperCase();
    if (role && CanInitiateGuard.REPLY_ONLY_ROLES.includes(role)) {
      throw new ForbiddenException('Your role is restricted to replying only');
    }
    return true;
  }
}
