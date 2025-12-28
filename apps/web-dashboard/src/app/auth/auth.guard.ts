import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateChildFn, CanMatchFn, Router } from '@angular/router';
import { combineLatest, filter, map, take } from 'rxjs';
import Auth from './auth';

export const authGuard: CanActivateChildFn = (_route, _state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  // In browser, localStorage is available immediately, so isAuthenticated works right away
  // For SSR, it will return false (which is correct - no auth on server)
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  return true;
};

export const teacherGuard: CanMatchFn = (_route, _state) => {
  const auth = inject(Auth);
  const isLoading$ = toObservable(auth.isUserLoading);
  const isTeacher$ = toObservable(auth.isTeacher);

  return combineLatest([isLoading$, isTeacher$]).pipe(
    filter(([isLoading]) => !isLoading),
    map(([, isTeacher]) => isTeacher),
    take(1)
  );
};

export const adminGuard: CanMatchFn = (_route, _state) => {
  const auth = inject(Auth);
  const isLoading$ = toObservable(auth.isUserLoading);
  const isAdmin$ = toObservable(auth.isAdmin);

  return combineLatest([isLoading$, isAdmin$]).pipe(
    filter(([isLoading]) => !isLoading),
    map(([, isAdmin]) => isAdmin),
    take(1)
  );
};

export const studentGuard: CanMatchFn = (_route, _state) => {
  const auth = inject(Auth);
  const isLoading$ = toObservable(auth.isUserLoading);
  const isStudent$ = toObservable(auth.isStudent);

  return combineLatest([isLoading$, isStudent$]).pipe(
    filter(([isLoading]) => !isLoading),
    map(([, isStudent]) => isStudent),
    take(1)
  );
};
