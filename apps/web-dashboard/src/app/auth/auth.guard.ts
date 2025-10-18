import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import Auth from './auth';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  console.log(auth.isAuthenticated());
  if (!auth.isAuthenticated()) {
    console.log('not authenticated');
    return router.createUrlTree(['/login']);
  }
  return true;
};
