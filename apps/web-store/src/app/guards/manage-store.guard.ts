import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SchoolContext } from '@/shared';
import { Apollo } from 'apollo-angular';
import { catchError, map, of } from 'rxjs';
import { StoreMeDocument } from '../graphql/generated/graphql';
import { storeBaseSegments } from '../store-nav';

export const manageStoreGuard: CanActivateFn = () => {
  const apollo = inject(Apollo);
  const router = inject(Router);
  const school = inject(SchoolContext);
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
        return router.createUrlTree(storeBaseSegments(school));
      }),
      catchError(() => of(router.createUrlTree(storeBaseSegments(school)))),
    );
};
