import { AuthUserContext } from '@/auth';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserContext;
      session?: {
        user: {
          id: string;
          email: string;
          name?: string;
          role?: { name: string };
          organizationId?: string;
        };
        activeOrganizationId?: string;
      };
    }
  }
}

export {};
