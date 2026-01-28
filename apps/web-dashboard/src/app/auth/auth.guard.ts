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

export const teacherGuard: CanMatchFn = () => {
  const auth = inject(Auth);
  const role = auth.role();
  // Return false if role not loaded yet - let other routes match
  return role === 'TEACHER';
};

export const adminGuard: CanMatchFn = () => {
  const auth = inject(Auth);
  const role = auth.role();
  // Return true for ADMIN or ORG_ADMIN roles
  return role === 'ADMIN' || role === 'ORG_ADMIN';
};

export const studentGuard: CanMatchFn = () => {
  const auth = inject(Auth);
  const role = auth.role();
  return role === 'STUDENT';
};
