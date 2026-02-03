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
