import { Route } from '@angular/router';
import { adminGuard, authGuard, onboardingGuard, permissionGuard, studentGuard, teacherGuard } from './auth/auth.guard';

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
  // Main dashboard (requires auth)
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    title: 'Software Educativo | Skooltrak',
    loadComponent: () => import('./core/dashboard'),
    children: [
      // Role-based home pages
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

      // General feature routes (permission-gated)
      {
        path: 'courses',
        canActivate: [permissionGuard('VIEW_COURSES')],
        loadComponent: () => import('./courses/courses'),
      },
      {
        path: 'courses/:id',
        canActivate: [permissionGuard('VIEW_COURSES')],
        loadComponent: () => import('./courses/course'),
      },
      {
        path: 'assignments',
        canActivate: [permissionGuard('VIEW_ASSIGNMENTS')],
        loadComponent: () => import('./assignments/assignments'),
      },
      {
        path: 'assignments/:id',
        canActivate: [permissionGuard('VIEW_ASSIGNMENTS')],
        loadComponent: () => import('./assignments/assignment'),
      },
      {
        path: 'teachers',
        canActivate: [permissionGuard('VIEW_TEACHERS')],
        loadComponent: () => import('./teachers/teachers'),
      },
      {
        path: 'teachers/new',
        canActivate: [permissionGuard('MANAGE_TEACHERS')],
        loadComponent: () => import('./teachers/teacher-form'),
      },
      {
        path: 'teachers/:id',
        canActivate: [permissionGuard('VIEW_TEACHERS')],
        loadComponent: () => import('./teachers/teacher'),
      },
      {
        path: 'teachers/:id/edit',
        canActivate: [permissionGuard('MANAGE_TEACHERS')],
        loadComponent: () => import('./teachers/teacher-form'),
      },
      {
        path: 'grades/:id',
        canActivate: [permissionGuard('VIEW_GRADES')],
        loadComponent: () => import('./grades/grade'),
      },
      {
        path: 'quizzes',
        canActivate: [permissionGuard('VIEW_QUIZZES')],
        loadComponent: () => import('./quizzes/quizzes'),
      },
      {
        path: 'quizzes/:id',
        canActivate: [permissionGuard('MANAGE_QUIZZES')],
        loadComponent: () => import('./quizzes/quiz-form'),
      },
      {
        path: 'messages',
        canActivate: [permissionGuard('VIEW_MESSAGES')],
        loadComponent: () => import('./messages/messages'),
      },
      {
        path: 'messages/compose',
        canActivate: [permissionGuard('MANAGE_MESSAGES')],
        loadComponent: () => import('./messages/compose'),
      },
      {
        path: 'messages/:id',
        canActivate: [permissionGuard('VIEW_MESSAGES')],
        loadComponent: () => import('./messages/message'),
      },
      {
        path: 'files',
        canActivate: [permissionGuard('VIEW_FILES')],
        loadComponent: () => import('./files/files'),
      },
      {
        path: 'students',
        canActivate: [permissionGuard('VIEW_STUDENTS')],
        loadComponent: () => import('./students/students'),
      },
      {
        path: 'students/new',
        canActivate: [permissionGuard('MANAGE_STUDENTS')],
        loadComponent: () => import('./students/student-form'),
      },
      {
        path: 'students/:id',
        canActivate: [permissionGuard('VIEW_STUDENTS')],
        loadComponent: () => import('./students/student'),
      },
      {
        path: 'students/:id/edit',
        canActivate: [permissionGuard('MANAGE_STUDENTS')],
        loadComponent: () => import('./students/student-form'),
      },
      {
        path: 'groups',
        canActivate: [permissionGuard('VIEW_CLASS_GROUPS')],
        loadComponent: () => import('./groups/groups'),
      },
      {
        path: 'groups/:id',
        canActivate: [permissionGuard('VIEW_CLASS_GROUPS')],
        loadComponent: () => import('./groups/group'),
      },

      // Student-specific routes
      {
        path: 'student/schedule',
        canActivate: [permissionGuard('VIEW_SCHEDULES')],
        loadComponent: () => import('./students/student-schedule'),
      },
      {
        path: 'student/assignments',
        canActivate: [permissionGuard('SUBMIT_ASSIGNMENTS')],
        loadComponent: () => import('./students/student-assignment-submission'),
      },
      {
        path: 'student/notifications',
        canActivate: [permissionGuard('VIEW_MESSAGES')],
        loadComponent: () => import('./students/student-notifications'),
      },
      {
        path: 'student/attendance',
        canActivate: [permissionGuard('VIEW_ATTENDANCE')],
        loadComponent: () => import('./students/student-attendance'),
      },

      // Teacher-specific routes
      {
        path: 'teacher/attendance',
        canActivate: [permissionGuard('MANAGE_ATTENDANCE')],
        loadComponent: () => import('./teacher/teacher-attendance'),
      },
      {
        path: 'teacher/gradebook',
        canActivate: [permissionGuard('MANAGE_GRADES')],
        loadComponent: () => import('./teacher/teacher-gradebook'),
      },
      {
        path: 'teacher/communication',
        canActivate: [permissionGuard('MANAGE_MESSAGES')],
        loadComponent: () => import('./teacher/teacher-parent-communication'),
      },
      {
        path: 'teacher/reports',
        canActivate: [permissionGuard('VIEW_GRADES')],
        loadComponent: () => import('./teacher/teacher-reports'),
      },

      // Parent-specific routes
      {
        path: 'parent/portal',
        canActivate: [permissionGuard('VIEW_GRADES')],
        loadComponent: () => import('./parent/parent-portal'),
      },
      {
        path: 'parent/progress',
        canActivate: [permissionGuard('VIEW_GRADES')],
        loadComponent: () => import('./parent/parent-child-progress'),
      },
      {
        path: 'parent/communication',
        canActivate: [permissionGuard('VIEW_MESSAGES')],
        loadComponent: () => import('./parent/parent-teacher-communication'),
      },
      {
        path: 'parent/notifications',
        canActivate: [permissionGuard('VIEW_MESSAGES')],
        loadComponent: () => import('./parent/parent-notifications'),
      },

      // Profile (always accessible when authenticated)
      {
        path: 'profile',
        loadComponent: () => import('./profile'),
      },
      {
        path: 'change-password',
        loadComponent: () => import('./auth/change-password'),
        title: 'Cambiar contraseña | Skooltrak',
      },

      // School management (admin-only)
      {
        path: 'schools/new',
        canActivate: [permissionGuard('MANAGE_SCHOOLS')],
        loadComponent: () => import('./admin/pages/school-form'),
      },
      {
        path: 'schools/:id',
        canActivate: [permissionGuard('VIEW_SCHOOLS')],
        loadComponent: () => import('./admin/pages/school'),
      },
      {
        path: 'schools/:id/edit',
        canActivate: [permissionGuard('MANAGE_SCHOOLS')],
        loadComponent: () => import('./admin/pages/school-form'),
      },

      // Admin panel (ORG_ADMIN only)
      {
        path: 'admin',
        canActivate: [permissionGuard('MANAGE_SCHOOLS')],
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

      // Default redirect
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./not-found'),
  },
];
