import { Route } from '@angular/router';
import { authGuard } from './auth/guards/auth.guard';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login'),
    title: 'Inicio de sesión | Skooltrak',
  },
  {
    path: '',
    canActivateChild: [authGuard],
    title: 'Panel de control | Skooltrak',
    loadComponent: () => import('./core/dashboard'),
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
        path: 'grade-metrics',
        loadComponent: () => import('./grade-metrics/grade-metrics'),
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
