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
        path: 'permissions/:id',
        loadComponent: () =>
          import('./permissions/permissions-form').then(
            (m) => m.PermissionsForm
          ),
      },
      {
        path: 'grade-metrics',
        loadComponent: () => import('./grade-metrics/grade-metrics'),
      },
      {
        path: 'periods',
        loadComponent: () => import('./periods/periods'),
      },
      {
        path: 'users',
        loadComponent: () => import('./users/users').then((m) => m.Users),
      },
      {
        path: 'student/schedule',
        loadComponent: () => import('./student/student-schedule'),
      },
      {
        path: 'student/assignments',
        loadComponent: () => import('./student/student-assignment-submission'),
      },
      {
        path: 'student/notifications',
        loadComponent: () => import('./student/student-notifications'),
      },
      {
        path: 'student/attendance',
        loadComponent: () => import('./student/student-attendance'),
      },
      {
        path: 'teacher/attendance',
        loadComponent: () => import('./teacher/teacher-attendance'),
      },
      {
        path: 'teacher/gradebook',
        loadComponent: () => import('./teacher/teacher-gradebook'),
      },
      {
        path: 'teacher/communication',
        loadComponent: () => import('./teacher/teacher-parent-communication'),
      },
      {
        path: 'teacher/reports',
        loadComponent: () => import('./teacher/teacher-reports'),
      },
      {
        path: 'parent/portal',
        loadComponent: () => import('./parent/parent-portal'),
      },
      {
        path: 'parent/progress',
        loadComponent: () => import('./parent/parent-child-progress'),
      },
      {
        path: 'parent/communication',
        loadComponent: () => import('./parent/parent-teacher-communication'),
      },
      {
        path: 'parent/notifications',
        loadComponent: () => import('./parent/parent-notifications'),
      },
      {
        path: 'parent-management',
        loadComponent: () => import('./admin/parent-management'),
      },
      {
        path: 'attendance-reporting',
        loadComponent: () => import('./admin/attendance-reporting'),
      },
      {
        path: 'financial-module',
        loadComponent: () => import('./admin/financial-module'),
      },
      {
        path: 'events-calendar',
        loadComponent: () => import('./admin/events-calendar'),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
];
