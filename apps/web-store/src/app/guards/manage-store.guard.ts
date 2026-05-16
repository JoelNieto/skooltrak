import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SchoolContext } from '@/shared';
import { catchError, map, of } from 'rxjs';
import { StoreApiService } from '../store-api.service';
import { storeBaseSegments } from '../store-nav';

export const manageStoreGuard: CanActivateFn = () => {
  const api = inject(StoreApiService);
  const router = inject(Router);
  const school = inject(SchoolContext);
  return api.getMe().pipe(
      map((me) => {
        const u = me as {
          role?: { name?: string; permissions?: { descriptiveId: string }[] };
        };
        const roleName = u?.role?.name;
        const perms = u?.role?.permissions?.map((p) => p.descriptiveId) ?? [];
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
