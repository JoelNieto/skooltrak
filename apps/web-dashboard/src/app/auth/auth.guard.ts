import { inject } from '@angular/core';
import { CanActivateChildFn, CanMatchFn, Router } from '@angular/router';
import Auth from './auth';

export const authGuard: CanActivateChildFn = () => {
  console.log('authGuard', inject(Auth).isAuthenticated());
  if (inject(Auth).isAuthenticated()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login']);
};

export const teacherGuard: CanMatchFn = () => inject(Auth).isTeacher();

export const adminGuard: CanMatchFn = () => inject(Auth).isAdmin();

export const studentGuard: CanMatchFn = () => inject(Auth).isStudent();
