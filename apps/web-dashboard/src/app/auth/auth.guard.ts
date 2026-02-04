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
  // Wait for user data to load before checking role
  await auth.waitUntilReady();
  return auth.role() === 'TEACHER';
};

export const adminGuard: CanMatchFn = async () => {
  const auth = inject(Auth);
  // Wait for user data to load before checking role
  await auth.waitUntilReady();
  return auth.role() === 'ADMIN' || auth.role() === 'ORG_ADMIN';
};

export const studentGuard: CanMatchFn = async () => {
  const auth = inject(Auth);
  // Wait for user data to load before checking role
  await auth.waitUntilReady();
  return auth.role() === 'STUDENT';
};

/**
 * Guard that ensures the user's email is verified.
 * Redirects to /verify-email if not verified.
 */
export const emailVerifiedGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const isVerified = await auth.checkEmailVerified();
  if (!isVerified) {
    return router.createUrlTree(['/verify-email']);
  }
  return true;
};

/**
 * Guard that ensures the user has completed onboarding.
 * Redirects to /onboarding if not completed.
 */
export const onboardingCompletedGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  // First check email verification
  const isVerified = await auth.checkEmailVerified();
  if (!isVerified) {
    return router.createUrlTree(['/verify-email']);
  }

  // Then check onboarding status
  const status = await auth.checkOnboardingStatus();
  if (!status.onboardingCompleted) {
    return router.createUrlTree(['/onboarding']);
  }

  return true;
};

/**
 * Guard for the onboarding flow.
 * Only allows access if email is verified but onboarding is not completed.
 */
export const onboardingGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  // First check email verification
  const isVerified = await auth.checkEmailVerified();
  if (!isVerified) {
    return router.createUrlTree(['/verify-email']);
  }

  // If onboarding already completed, redirect to home
  const status = await auth.checkOnboardingStatus();
  if (status.onboardingCompleted) {
    return router.createUrlTree(['/home']);
  }

  return true;
};
