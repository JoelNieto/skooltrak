import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./core/dashboard').then((m) => m.Dashboard),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./core/home').then((m) => m.Home),
      },
      {
        path: 'organizations',
        loadComponent: () =>
          import('./organizations/organizations').then((m) => m.Organizations),
      },
      {
        path: 'roles',
        loadComponent: () => import('./roles/roles').then((m) => m.Roles),
      },
      {
        path: 'schools',
        loadComponent: () => import('./schools/schools').then((m) => m.Schools),
      },
      {
        path: 'permissions',
        loadComponent: () =>
          import('./permissions/permissions').then((m) => m.Permissions),
      },
      {
        path: 'users',
        loadComponent: () => import('./users/users').then((m) => m.Users),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
];
