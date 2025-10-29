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
        path: 'students',
        loadComponent: () => import('./admin/pages/students'),
      },
      {
        path: 'students/:id',
        loadComponent: () => import('./admin/pages/student'),
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
            path: 'class-groups',
            loadComponent: () => import('./admin/pages/class-groups'),
          },
          {
            path: 'study-plans',
            loadComponent: () => import('./admin/pages/study-plans'),
          },
          {
            path: 'teachers',
            loadComponent: () => import('./admin/pages/teachers'),
          },
          {
            path: 'degrees',
            loadComponent: () => import('./admin/pages/degrees'),
          },
          {
            path: 'students',
            loadComponent: () => import('./admin/pages/students'),
          },

          { path: '', redirectTo: 'subjects', pathMatch: 'full' },
        ],
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./not-found'),
  },
];
