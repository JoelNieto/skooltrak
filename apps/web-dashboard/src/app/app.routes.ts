import { Route } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const appRoutes: Route[] = [
  { path: 'login', loadComponent: () => import('./auth/login') },
  {
    path: '',
    canActivateChild: [authGuard],
    loadComponent: () => import('./core/dashboard'),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home'),
      },
      {
        path: 'courses',
        loadComponent: () => import('./courses/courses'),
      },
      {
        path: 'assignments',
        loadComponent: () => import('./assignments/assignments'),
      },
      {
        path: 'grades',
        loadComponent: () => import('./grades/grades'),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'admin',
        loadComponent: () => import('./admin/admin'),
        children: [
          {
            path: 'subjects',
            loadComponent: () => import('./admin/pages/subjects'),
          },
          {
            path: 'courses',
            loadComponent: () => import('./admin/pages/courses'),
          },
          {
            path: 'study-plans',
            loadComponent: () => import('./admin/pages/study-plans'),
          },
          {
            path: 'degrees',
            loadComponent: () => import('./admin/pages/degrees'),
          },
          { path: '', redirectTo: 'subjects', pathMatch: 'full' },
        ],
      },
    ],
  },
];
