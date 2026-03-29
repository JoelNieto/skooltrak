import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { catchError, map, of } from 'rxjs';
import { StoreMeDocument } from '../graphql/generated/graphql';

export const manageStoreGuard: CanActivateFn = () => {
  const apollo = inject(Apollo);
  const router = inject(Router);
  return apollo
    .query({
      query: StoreMeDocument,
      fetchPolicy: 'network-only',
    })
    .pipe(
      map((res) => {
        const perms =
          res.data?.me?.role?.permissions?.map((p: { descriptiveId: string }) => p.descriptiveId) ?? [];
        if (perms.includes('MANAGE_STORE')) {
          return true;
        }
        return router.createUrlTree(['/store']);
      }),
      catchError(() => of(router.createUrlTree(['/store']))),
    );
};
