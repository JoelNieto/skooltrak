import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateChildFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import Auth from '../auth';

export const authGuard: CanActivateChildFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const isLoading$ = toObservable(auth.isUserLoading);

  return isLoading$.pipe(
    filter((isLoading) => !isLoading),
    map(() => {
      // Check the signal value directly after loading completes
      // to avoid race conditions with combineLatest
      const isAuthenticated = auth.isAuthenticated();
      if (!isAuthenticated) {
        return router.createUrlTree(['/login']);
      }
      return true;
    }),
    take(1)
  );
};
