import { loadRemoteModule } from '@angular-architects/native-federation';
import { Routes } from '@angular/router';

export const shellRoutes: Routes = [
  {
    path: 'store',
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./school-directory'),
      },
      {
        path: ':schoolSlug',
        loadChildren: () =>
          loadRemoteModule('webStore', './routes').then((m) => m.STORE_ROUTES),
      },
    ],
  },
  {
    path: '',
    loadChildren: () =>
      loadRemoteModule('webDashboard', './routes').then((m) => m.DASHBOARD_ROUTES),
  },
];
