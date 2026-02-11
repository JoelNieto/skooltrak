import { Route } from '@angular/router';
import {
  adminGuard,
  authGuard,
  onboardingCompletedGuard,
  onboardingGuard,
  permissionGuard,
  studentGuard,
  teacherGuard,
} from './auth/auth.guard';

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
  // Onboarding flow (requires auth, routes based on onboardingStep)
  {
    path: 'onboarding',
    canActivate: [onboardingGuard],
    children: [
      {
        path: 'choose-path',
        loadComponent: () => import('./onboarding/choose-path'),
        title: 'Elige tu camino | Skooltrak',
      },
      {
        path: 'create-school',
        loadComponent: () => import('./onboarding/create-school'),
        title: 'Crear escuela | Skooltrak',
      },
      {
        path: 'join-school',
        loadComponent: () => import('./onboarding/join-school'),
        title: 'Unirse a escuela | Skooltrak',
      },
      {
        path: 'select-role',
        loadComponent: () => import('./onboarding/select-role'),
        title: 'Seleccionar rol | Skooltrak',
      },
      {
        path: 'confirm-request',
        loadComponent: () => import('./onboarding/confirm-request'),
        title: 'Confirmar solicitud | Skooltrak',
      },
      {
        path: 'verify-student',
        loadComponent: () => import('./onboarding/verify-student'),
        title: 'Verificación de estudiante | Skooltrak',
      },
      {
        path: 'verify-parent',
        loadComponent: () => import('./onboarding/verify-parent'),
        title: 'Verificación de padre | Skooltrak',
      },
      {
        path: 'waiting-approval',
        loadComponent: () => import('./onboarding/waiting-approval'),
        title: 'Esperando aprobación | Skooltrak',
      },
      {
        path: 'setup',
        loadComponent: () => import('./onboarding/setup-wizard'),
        title: 'Configuración inicial | Skooltrak',
      },
      // Legacy redirect
      {
        path: 'acknowledge',
        redirectTo: 'create-school',
        pathMatch: 'full',
      },
      { path: '', redirectTo: 'choose-path', pathMatch: 'full' },
    ],
  },
  // Main dashboard (requires auth + completed onboarding)
  {
    path: '',
    canActivate: [authGuard, onboardingCompletedGuard],
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

      // Newsletter view (any authenticated user)
      {
        path: 'newsletters/:id',
        canActivate: [permissionGuard('VIEW_NEWSLETTER')],
        loadComponent: () => import('./newsletters/newsletter-view'),
      },

      // Newsletter management (admin-only)
      {
        path: 'admin/newsletters/new',
        canActivate: [permissionGuard('MANAGE_NEWSLETTER')],
        loadComponent: () => import('./admin/forms/newsletter-form'),
      },
      {
        path: 'admin/newsletters/:id/edit',
        canActivate: [permissionGuard('MANAGE_NEWSLETTER')],
        loadComponent: () => import('./admin/forms/newsletter-form'),
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
            path: 'parents',
            loadComponent: () => import('./admin/pages/parent-management'),
          },
          {
            path: 'join-requests',
            loadComponent: () => import('./admin/pages/join-requests'),
            title: 'Solicitudes de ingreso | Skooltrak',
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
          {
            path: 'newsletters',
            loadComponent: () => import('./admin/pages/newsletters'),
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
