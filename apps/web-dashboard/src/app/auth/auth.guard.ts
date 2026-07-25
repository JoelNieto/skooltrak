import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, CanMatchFn, Router, UrlTree } from '@angular/router';
import Auth from './auth';
import { OnboardingStep } from './onboarding-step';

/** Session/token present but `me` failed or is absent — avoid mis-routing to onboarding. */
function urlTreeIfMeMissing(auth: Auth, router: Router): UrlTree | null {
  if (auth.isAuthenticated() && auth.user() == null) {
    return router.createUrlTree(['/login']);
  }
  return null;
}

export const authGuard: CanActivateFn & CanActivateChildFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

export const teacherGuard: CanMatchFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);
  await auth.waitUntilReady();
  return urlTreeIfMeMissing(auth, router) ?? auth.role() === 'TEACHER';
};

export const adminGuard: CanMatchFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);
  await auth.waitUntilReady();
  return urlTreeIfMeMissing(auth, router) ?? (auth.role() === 'ADMIN' || auth.role() === 'ORG_ADMIN');
};

export const studentGuard: CanMatchFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);
  await auth.waitUntilReady();
  return urlTreeIfMeMissing(auth, router) ?? auth.role() === 'STUDENT';
};

export const parentGuard: CanMatchFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);
  await auth.waitUntilReady();
  return urlTreeIfMeMissing(auth, router) ?? auth.role() === 'PARENT';
};

/**
 * Factory that creates a CanActivate guard requiring at least one of
 * the given permission descriptiveIds (OR logic).
 */
export function permissionGuard(...permissions: string[]): CanActivateFn {
  return async () => {
    const auth = inject(Auth);
    const router = inject(Router);
    await auth.waitUntilReady();
    const missing = urlTreeIfMeMissing(auth, router);
    if (missing) {
      return missing;
    }

    if (permissions.some((p) => auth.hasPermission(p))) {
      return true;
    }

    return router.createUrlTree(['/home']);
  };
}

/**
 * Factory that creates a CanMatch guard requiring at least one of
 * the given permission descriptiveIds (OR logic).
 */
export function permissionMatchGuard(...permissions: string[]): CanMatchFn {
  return async () => {
    const auth = inject(Auth);
    const router = inject(Router);
    await auth.waitUntilReady();
    return urlTreeIfMeMissing(auth, router) ?? permissions.some((p) => auth.hasPermission(p));
  };
}

/**
 * Guard for the onboarding flow.
 * Requires authentication. Allows access to onboarding routes
 * for users who haven't completed onboarding yet.
 */
export const onboardingGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  // Wait for user data to be available
  await auth.waitUntilReady();
  const missing = urlTreeIfMeMissing(auth, router);
  if (missing) {
    return missing;
  }

  const u = auth.user()!;
  const step = auth.onboardingStep();
  const hasOrg = !!(u as { organizationId?: string | null }).organizationId;
  const hasRole = !!auth.role() && auth.role() !== 'member';

  // Only send fully-onboarded users (org + role) to the dashboard. A user with
  // an org but no role must stay in onboarding, otherwise /home matches no
  // role-gated child route and falls through to the 404 page.
  if (hasOrg && hasRole && (step === OnboardingStep.COMPLETED || step == null || step === '')) {
    return router.createUrlTree(['/home']);
  }

  // Allow access to onboarding routes
  return true;
};

/**
 * Guard that ensures onboarding is completed before accessing the dashboard.
 * Redirects to the appropriate onboarding step if not completed.
 *
 * Key rule: a user with no `organizationId` has NOT finished onboarding,
 * regardless of `onboardingStep`. Such users must never reach `/home`, whose
 * children are all role-gated (`canMatch`) — with no role they would match
 * nothing and fall through to the `**` (404) route.
 */
export const onboardingCompletedGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  // Wait for user data
  await auth.waitUntilReady();
  const missing = urlTreeIfMeMissing(auth, router);
  if (missing) {
    return missing;
  }

  const u = auth.user()!;
  const step = auth.onboardingStep();
  const hasOrg = !!(u as { organizationId?: string | null }).organizationId;
  const hasRole = !!auth.role() && auth.role() !== 'member';

  // Fully onboarded members (org + role) may enter the dashboard.
  if (hasOrg && hasRole) {
    // Org admins mid school-setup still need the setup wizard.
    if (step === OnboardingStep.SCHOOL_SETUP) {
      return router.createUrlTree(['/onboarding/setup']);
    }
    return true;
  }

  // Not fully onboarded yet -> route to the correct onboarding step.
  switch (step) {
    case OnboardingStep.SCHOOL_SETUP:
      return router.createUrlTree(['/onboarding/setup']);
    case OnboardingStep.WAITING_APPROVAL:
      return router.createUrlTree(['/onboarding/waiting-approval']);
    case OnboardingStep.CHOOSE_PATH:
    default:
      return router.createUrlTree(['/onboarding/choose-path']);
  }
};
