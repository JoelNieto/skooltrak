import { Route } from '@angular/router';
import { adminGuard, authGuard, onboardingGuard, studentGuard, teacherGuard } from './auth/auth.guard';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login'),
    title: 'Inicio de sesión | Skooltrak',
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register'),
    title: 'Registro | Skooltrak',
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./auth/forgot-password'),
    title: 'Recuperar contraseña | Skooltrak',
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./auth/reset-password'),
    title: 'Restablecer contraseña | Skooltrak',
  },
  {
    path: 'accept-invitation/:id',
    loadComponent: () => import('./auth/accept-invitation'),
    title: 'Aceptar invitación | Skooltrak',
  },
  // Email verification page (requires auth but not verified email)
  {
    path: 'verify-email',
    canActivate: [authGuard],
    loadComponent: () => import('./auth/verify-email'),
    title: 'Verificar correo | Skooltrak',
  },
  // Onboarding flow (requires verified email but not completed onboarding)
  {
    path: 'onboarding',
    canActivate: [onboardingGuard],
    children: [
      {
        path: 'acknowledge',
        loadComponent: () => import('./onboarding/school-acknowledgment'),
        title: 'Configuración inicial | Skooltrak',
      },
      {
        path: 'setup',
        loadComponent: () => import('./onboarding/setup-wizard'),
        title: 'Configuración inicial | Skooltrak',
      },
      { path: '', redirectTo: 'acknowledge', pathMatch: 'full' },
    ],
  },
  // Main dashboard (requires auth, verified email, and completed onboarding for admins)
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    title: 'Software Educativo | Skooltrak',
    loadComponent: () => import('./core/dashboard'),
    children: [
      {
        path: 'home',
        canMatch: [adminGuard],
        loadComponent: () => import('./home'),
      },

      {
        path: 'home',
        canMatch: [teacherGuard],
        loadComponent: () => import('./teacher-home'),
      },
      {
        path: 'home',
        canMatch: [studentGuard],
        loadComponent: () => import('./student-home'),
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
        path: 'teachers/new',
        loadComponent: () => import('./teachers/teacher-form'),
      },
      {
        path: 'teachers/:id',
        loadComponent: () => import('./teachers/teacher'),
      },
      {
        path: 'teachers/:id/edit',
        loadComponent: () => import('./teachers/teacher-form'),
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
        path: 'files',
        loadComponent: () => import('./files/files'),
      },
      {
        path: 'student/schedule',
        loadComponent: () => import('./students/student-schedule'),
      },
      {
        path: 'student/assignments',
        loadComponent: () => import('./students/student-assignment-submission'),
      },
      {
        path: 'student/notifications',
        loadComponent: () => import('./students/student-notifications'),
      },
      {
        path: 'student/attendance',
        loadComponent: () => import('./students/student-attendance'),
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
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'students',
        loadComponent: () => import('./students/students'),
      },
      {
        path: 'students/new',
        loadComponent: () => import('./students/student-form'),
      },
      {
        path: 'students/:id',
        loadComponent: () => import('./students/student'),
      },
      {
        path: 'students/:id/edit',
        loadComponent: () => import('./students/student-form'),
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
        path: 'profile',
        loadComponent: () => import('./profile'),
      },
      {
        path: 'change-password',
        loadComponent: () => import('./auth/change-password'),
        title: 'Cambiar contraseña | Skooltrak',
      },

      {
        path: 'schools/new',
        loadComponent: () => import('./admin/pages/school-form'),
      },
      {
        path: 'schools/:id',
        loadComponent: () => import('./admin/pages/school'),
      },
      {
        path: 'schools/:id/edit',
        loadComponent: () => import('./admin/pages/school-form'),
      },
      {
        path: 'admin',
        loadComponent: () => import('./admin/admin'),
        children: [
          {
            path: 'schools',
            loadComponent: () => import('./admin/pages/schools'),
          },

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
            path: 'degrees',
            loadComponent: () => import('./admin/pages/degrees'),
          },
          {
            path: 'periods',
            loadComponent: () => import('./admin/pages/periods'),
          },
          {
            path: 'parents',
            loadComponent: () => import('./admin/pages/parent-management'),
          },
          {
            path: 'attendance-reporting',
            loadComponent: () => import('./admin/pages/attendance-reporting'),
          },
          {
            path: 'financial-module',
            loadComponent: () => import('./admin/pages/financial-module'),
          },
          {
            path: 'events-calendar',
            loadComponent: () => import('./admin/pages/events-calendar'),
          },

          { path: '', redirectTo: 'schools', pathMatch: 'full' },
        ],
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./not-found'),
  },
];
