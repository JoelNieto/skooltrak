import { Route } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login'),
    title: 'Inicio de sesión | Skooltrak',
  },
  {
    path: '',
    canActivateChild: [authGuard],
    title: 'Software Educativo | Skooltrak',
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
      { path: 'courses/:id', loadComponent: () => import('./courses/course') },
      {
        path: 'assignments',
        loadComponent: () => import('./assignments/assignments'),
      },
      {
        path: 'assignments/:id',
        loadComponent: () => import('./assignments/assignment'),
      },
      { path: 'teachers', loadComponent: () => import('./teachers/teachers') },
      {
        path: 'teachers/:id',
        loadComponent: () => import('./teachers/teacher'),
      },
      {
        path: 'teachers/:id/edit',
        loadComponent: () => import('./teachers/teacher-form'),
      },
      {
        path: 'grades',
        loadComponent: () => import('./grades/grades'),
      },
      { path: 'grades/:id', loadComponent: () => import('./grades/grade') },
      { path: 'quizzes', loadComponent: () => import('./quizzes/quizzes') },
      {
        path: 'quizzes/:id',
        loadComponent: () => import('./quizzes/quiz-form'),
      },
      {
        path: 'messages',
        loadComponent: () => import('./messages/messages'),
      },
      {
        path: 'messages/compose',
        loadComponent: () => import('./messages/compose'),
      },
      {
        path: 'messages/:id',
        loadComponent: () => import('./messages/message'),
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
        path: 'groups',
        loadComponent: () => import('./groups/groups'),
      },
      {
        path: 'groups/:id',
        loadComponent: () => import('./groups/group'),
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
          {
            path: 'periods',
            loadComponent: () => import('./admin/pages/periods'),
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
