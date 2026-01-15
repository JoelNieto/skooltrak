import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[appSidebar]',
  imports: [RouterLink, RouterLinkActive],
  template: `<div class="flex items-center justify-between px-4 pt-4 pb-2">
      <h1 class="text-xl font-semibold text-primary flex items-center gap-2">
        SkoolTrak
      </h1>
    </div>
    <nav class="p-2 flex flex-col gap-8 flex-1 min-h-0 overflow-y-auto">
      <ul class="space-y-4">
        <li>
          <a
            routerLink="home"
            [routerLinkActive]="[
              'bg-base-200',
              'text-primary',
              'dark:text-white'
            ]"
            class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
          >
            <span class="material-symbols-outlined text-xl">home</span>
            <span class="ml-3">Inicio</span>
          </a>
        </li>
        <li>
          <a
            routerLink="organizations"
            [routerLinkActive]="[
              'bg-base-200',
              'text-primary',
              'dark:text-white'
            ]"
            class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
          >
            <span class="material-symbols-outlined text-xl">account_tree</span>
            <span class="ml-3">Organizaciones</span>
          </a>
        </li>
        <li>
          <a
            routerLink="schools"
            [routerLinkActive]="[
              'bg-base-200',
              'text-primary',
              'dark:text-white'
            ]"
            class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
          >
            <span class="material-symbols-outlined text-xl">domain</span>
            <span class="ml-3">Escuelas</span>
          </a>
        </li>
        <li>
          <a
            routerLink="roles"
            [routerLinkActive]="[
              'bg-base-200',
              'text-primary',
              'dark:text-white'
            ]"
            class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
          >
            <span class="material-symbols-outlined text-xl"
              >manage_accounts</span
            >
            <span class="ml-3">Roles</span>
          </a>
        </li>
        <li>
          <a
            routerLink="grade-metrics"
            [routerLinkActive]="[
              'bg-base-200',
              'text-primary',
              'dark:text-white'
            ]"
            class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
          >
            <span class="material-symbols-outlined text-xl">table_chart</span>
            <span class="ml-3">Metricas</span>
          </a>
        </li>
        <li>
          <a
            routerLink="permissions"
            [routerLinkActive]="[
              'bg-base-200',
              'text-primary',
              'dark:text-white'
            ]"
            class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
          >
            <span class="material-symbols-outlined text-xl"
              >folder_managed</span
            >
            <span class="ml-3">Permisos</span>
          </a>
        </li>
        <li>
          <a
            routerLink="users"
            [routerLinkActive]="[
              'bg-base-200',
              'text-primary',
              'dark:text-white'
            ]"
            class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
          >
            <span class="material-symbols-outlined text-xl">group</span>
            <span class="ml-3">Usuarios</span>
          </a>
        </li>
        <li class="px-2 text-xs uppercase text-base-content/60">
          Administración
        </li>
        <li>
          <a
            routerLink="parent-management"
            [routerLinkActive]="[
              'bg-base-200',
              'text-primary',
              'dark:text-white'
            ]"
            class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
          >
            <span class="material-symbols-outlined text-xl"
              >supervisor_account</span
            >
            <span class="ml-3">Padres</span>
          </a>
        </li>
        <li>
          <a
            routerLink="attendance-reporting"
            [routerLinkActive]="[
              'bg-base-200',
              'text-primary',
              'dark:text-white'
            ]"
            class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
          >
            <span class="material-symbols-outlined text-xl">fact_check</span>
            <span class="ml-3">Asistencia</span>
          </a>
        </li>
        <li>
          <a
            routerLink="financial-module"
            [routerLinkActive]="[
              'bg-base-200',
              'text-primary',
              'dark:text-white'
            ]"
            class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
          >
            <span class="material-symbols-outlined text-xl">payments</span>
            <span class="ml-3">Finanzas</span>
          </a>
        </li>
        <li>
          <a
            routerLink="events-calendar"
            [routerLinkActive]="[
              'bg-base-200',
              'text-primary',
              'dark:text-white'
            ]"
            class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
          >
            <span class="material-symbols-outlined text-xl">event</span>
            <span class="ml-3">Eventos</span>
          </a>
        </li>
        <li class="px-2 text-xs uppercase text-base-content/60">Estudiante</li>
        <li>
          <a
            routerLink="student/schedule"
            [routerLinkActive]="[
              'bg-base-200',
              'text-primary',
              'dark:text-white'
            ]"
            class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
          >
            <span class="material-symbols-outlined text-xl">event</span>
            <span class="ml-3">Agenda</span>
          </a>
        </li>
        <li>
          <a
            routerLink="student/assignments"
            [routerLinkActive]="[
              'bg-base-200',
              'text-primary',
              'dark:text-white'
            ]"
            class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
          >
            <span class="material-symbols-outlined text-xl">upload_file</span>
            <span class="ml-3">Entregas</span>
          </a>
        </li>
        <li>
          <a
            routerLink="student/notifications"
            [routerLinkActive]="[
              'bg-base-200',
              'text-primary',
              'dark:text-white'
            ]"
            class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
          >
            <span class="material-symbols-outlined text-xl">notifications</span>
            <span class="ml-3">Notificaciones</span>
          </a>
        </li>
        <li>
          <a
            routerLink="student/attendance"
            [routerLinkActive]="[
              'bg-base-200',
              'text-primary',
              'dark:text-white'
            ]"
            class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
          >
            <span class="material-symbols-outlined text-xl">fact_check</span>
            <span class="ml-3">Asistencia</span>
          </a>
        </li>
        <li class="px-2 text-xs uppercase text-base-content/60">Docente</li>
        <li>
          <a
            routerLink="teacher/attendance"
            [routerLinkActive]="[
              'bg-base-200',
              'text-primary',
              'dark:text-white'
            ]"
            class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
          >
            <span class="material-symbols-outlined text-xl"
              >playlist_add_check</span
            >
            <span class="ml-3">Tomar asistencia</span>
          </a>
        </li>
        <li>
          <a
            routerLink="teacher/gradebook"
            [routerLinkActive]="[
              'bg-base-200',
              'text-primary',
              'dark:text-white'
            ]"
            class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
          >
            <span class="material-symbols-outlined text-xl">table</span>
            <span class="ml-3">Libro de notas</span>
          </a>
        </li>
        <li>
          <a
            routerLink="teacher/communication"
            [routerLinkActive]="[
              'bg-base-200',
              'text-primary',
              'dark:text-white'
            ]"
            class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
          >
            <span class="material-symbols-outlined text-xl">forum</span>
            <span class="ml-3">Comunicación</span>
          </a>
        </li>
        <li>
          <a
            routerLink="teacher/reports"
            [routerLinkActive]="[
              'bg-base-200',
              'text-primary',
              'dark:text-white'
            ]"
            class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
          >
            <span class="material-symbols-outlined text-xl">assessment</span>
            <span class="ml-3">Reportes</span>
          </a>
        </li>
        <li class="px-2 text-xs uppercase text-base-content/60">Padres</li>
        <li>
          <a
            routerLink="parent/portal"
            [routerLinkActive]="[
              'bg-base-200',
              'text-primary',
              'dark:text-white'
            ]"
            class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
          >
            <span class="material-symbols-outlined text-xl"
              >family_restroom</span
            >
            <span class="ml-3">Portal</span>
          </a>
        </li>
        <li>
          <a
            routerLink="parent/progress"
            [routerLinkActive]="[
              'bg-base-200',
              'text-primary',
              'dark:text-white'
            ]"
            class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
          >
            <span class="material-symbols-outlined text-xl">bar_chart</span>
            <span class="ml-3">Progreso</span>
          </a>
        </li>
        <li>
          <a
            routerLink="parent/communication"
            [routerLinkActive]="[
              'bg-base-200',
              'text-primary',
              'dark:text-white'
            ]"
            class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
          >
            <span class="material-symbols-outlined text-xl">chat</span>
            <span class="ml-3">Mensajes</span>
          </a>
        </li>
        <li>
          <a
            routerLink="parent/notifications"
            [routerLinkActive]="[
              'bg-base-200',
              'text-primary',
              'dark:text-white'
            ]"
            class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
          >
            <span class="material-symbols-outlined text-xl"
              >notifications_active</span
            >
            <span class="ml-3">Alertas</span>
          </a>
        </li>
      </ul>
    </nav>`,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {}
