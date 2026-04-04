import { Routes } from '@angular/router';
import { STORE_ROUTES } from './store.routes';

/**
 * Standalone dev server: `/store` lists schools; `/store/:schoolSlug` loads the remote route tree.
 * In the shell host, the same segments are composed by the shell (`store` + `:schoolSlug` + remote).
 */
export const appRoutes: Routes = [
  {
    path: 'store',
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/school-picker-standalone'),
      },
      {
        path: ':schoolSlug',
        children: STORE_ROUTES,
      },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'store' },
];
