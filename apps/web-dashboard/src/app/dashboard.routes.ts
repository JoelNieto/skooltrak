import { Route } from '@angular/router';
import {
  adminGuard,
  authGuard,
  onboardingCompletedGuard,
  onboardingGuard,
  parentGuard,
  permissionGuard,
  studentGuard,
  teacherGuard,
} from './auth/auth.guard';
import { STORE_ROUTES } from './store/store.routes';

export const DASHBOARD_ROUTES: Route[] = [
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
  {
    path: 'auth/magic-link',
    loadComponent: () => import('./auth/magic-link-request'),
    title: 'Acceso sin contraseña | Skooltrak',
  },
  {
    path: 'auth/magic-link-callback',
    loadComponent: () => import('./auth/magic-link-callback'),
    title: 'Verificando acceso | Skooltrak',
  },
  {
    path: 'onboarding/connect-child',
    loadComponent: () => import('./auth/connect-child'),
    title: 'Vincular estudiante | Skooltrak',
  },
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
      {
        path: 'acknowledge',
        redirectTo: 'create-school',
        pathMatch: 'full',
      },
      { path: '', redirectTo: 'choose-path', pathMatch: 'full' },
    ],
  },
  {
    path: 'store',
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./store/pages/school-picker-standalone'),
      },
      {
        path: ':schoolSlug',
        children: STORE_ROUTES,
      },
    ],
  },
  {
    path: '',
    canActivate: [authGuard, onboardingCompletedGuard],
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
        path: 'home',
        canMatch: [parentGuard],
        loadComponent: () => import('./parent-home'),
      },
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
        path: 'quizzes/new',
        canActivate: [permissionGuard('MANAGE_QUIZZES')],
        loadComponent: () => import('./quizzes/quiz-form'),
      },
      {
        path: 'quizzes/:id',
        canActivate: [permissionGuard('VIEW_QUIZZES')],
        loadComponent: () => import('./quizzes/quiz'),
      },
      {
        path: 'quizzes/:id/edit',
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
        path: 'chats',
        canActivate: [permissionGuard('VIEW_MESSAGES')],
        loadComponent: () => import('./chats/chats'),
      },
      {
        path: 'chats/new',
        canActivate: [permissionGuard('MANAGE_MESSAGES')],
        loadComponent: () => import('./chats/chat-new'),
      },
      {
        path: 'chats/:id',
        canActivate: [permissionGuard('VIEW_MESSAGES')],
        loadComponent: () => import('./chats/chat-thread'),
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
        path: 'students/:id/grade-report',
        canActivate: [permissionGuard('VIEW_STUDENTS')],
        loadComponent: () => import('./students/grade-report'),
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
      {
        path: 'student/finances',
        canActivate: [permissionGuard('VIEW_FINANCIALS')],
        loadComponent: () => import('./students/student-finances'),
      },
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
      {
        path: 'parent/finances',
        canActivate: [permissionGuard('VIEW_FINANCIALS')],
        loadComponent: () => import('./parent/parent-finances'),
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
      {
        path: 'newsletters/:id',
        canActivate: [permissionGuard('VIEW_NEWSLETTER')],
        loadComponent: () => import('./newsletters/newsletter-view'),
      },
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
            path: 'imports',
            canActivate: [permissionGuard('MANAGE_STUDENTS')],
            loadComponent: () => import('./admin/pages/imports'),
            title: 'Importación masiva | Skooltrak',
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
