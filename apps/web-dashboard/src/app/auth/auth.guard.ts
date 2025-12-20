import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import Auth from './auth';

export const authGuard: CanActivateFn = (_route, _state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  // In browser, localStorage is available immediately, so isAuthenticated works right away
  // For SSR, it will return false (which is correct - no auth on server)
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  return true;
};
