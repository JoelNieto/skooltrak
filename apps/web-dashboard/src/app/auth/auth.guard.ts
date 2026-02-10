import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, CanMatchFn, Router } from '@angular/router';
import Auth from './auth';

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
  await auth.waitUntilReady();
  return auth.role() === 'TEACHER';
};

export const adminGuard: CanMatchFn = async () => {
  const auth = inject(Auth);
  await auth.waitUntilReady();
  return auth.role() === 'ADMIN' || auth.role() === 'ORG_ADMIN';
};

export const studentGuard: CanMatchFn = async () => {
  const auth = inject(Auth);
  await auth.waitUntilReady();
  return auth.role() === 'STUDENT';
};

export const parentGuard: CanMatchFn = async () => {
  const auth = inject(Auth);
  await auth.waitUntilReady();
  return auth.role() === 'PARENT';
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
    await auth.waitUntilReady();
    return permissions.some((p) => auth.hasPermission(p));
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

  const step = auth.onboardingStep();

  // If onboarding is already completed, redirect to dashboard
  if (step === 'completed') {
    return router.createUrlTree(['/home']);
  }

  // Allow access to onboarding routes
  return true;
};

/**
 * Guard that ensures onboarding is completed before accessing the dashboard.
 * Redirects to appropriate onboarding step if not completed.
 */
export const onboardingCompletedGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  // Wait for user data
  await auth.waitUntilReady();

  const step = auth.onboardingStep();

  // If user has completed onboarding, allow through
  if (step === 'completed') {
    return true;
  }

  // Route based on onboarding step
  switch (step) {
    case 'choose-path':
      return router.createUrlTree(['/onboarding/choose-path']);
    case 'school-setup':
      return router.createUrlTree(['/onboarding/setup']);
    case 'waiting-approval':
      return router.createUrlTree(['/onboarding/waiting-approval']);
    default:
      // No step set yet, or unknown step -> go to choose-path
      return router.createUrlTree(['/onboarding/choose-path']);
  }
};
