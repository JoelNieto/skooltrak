import { createAuthClient } from 'better-auth/client';
import { organizationClient } from 'better-auth/client/plugins';

// Get the base URL - in browser use window.location, in SSR use environment variable
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:4200';
};

/**
 * Better-auth client configuration for the web-admin app
 * This client handles all authentication operations
 */
export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  basePath: '/api/auth',
  plugins: [organizationClient()],
});

// Export types for use in the app
export type Session = typeof authClient.$Infer.Session;
export type User = Session['user'];
