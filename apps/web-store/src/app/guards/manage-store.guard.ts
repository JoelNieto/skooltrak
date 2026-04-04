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
        const roleName = res.data?.me?.role?.name;
        const perms =
          res.data?.me?.role?.permissions?.map((p: { descriptiveId: string }) => p.descriptiveId) ?? [];
        // Match dashboard Auth.hasPermission('MANAGE_STORE'): explicit perm or org/school admin role.
        const canManage =
          perms.includes('MANAGE_STORE') ||
          roleName === 'ADMIN' ||
          roleName === 'ORG_ADMIN';
        if (canManage) {
          return true;
        }
        return router.createUrlTree(['/store']);
      }),
      catchError(() => of(router.createUrlTree(['/store']))),
    );
};
