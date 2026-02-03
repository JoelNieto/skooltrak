import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { map } from 'rxjs';
import Auth from './auth';

export const authGuard: CanActivateFn & CanActivateChildFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

export const teacherGuard: CanMatchFn = () => {
  const auth = inject(Auth);
  // Wait for user data to load before checking role
  return auth.whenReady$.pipe(map(() => auth.role() === 'TEACHER'));
};

export const adminGuard: CanMatchFn = () => {
  const auth = inject(Auth);
  // Wait for user data to load before checking role
  return auth.whenReady$.pipe(map(() => auth.role() === 'ADMIN' || auth.role() === 'ORG_ADMIN'));
};

export const studentGuard: CanMatchFn = () => {
  const auth = inject(Auth);
  // Wait for user data to load before checking role
  return auth.whenReady$.pipe(map(() => auth.role() === 'STUDENT'));
};
