import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[appSidebar]',
  imports: [RouterLink, RouterLinkActive],
  template: `<div class="flex items-center justify-between px-4 py-5">
      <h1 class="text-xl font-semibold text-primary flex items-center gap-2">
        <img src="skooltrak.png" alt="Skooltrak" class="h-8" />
      </h1>
    </div>
    <nav class="px-3 flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto">
      <!-- General Section -->
      <ul class="space-y-0.5">
        <li>
          <a
            routerLink="home"
            routerLinkActive="bg-primary/10 text-primary font-semibold"
            class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
          >
            <span class="material-symbols-outlined text-xl">home</span>
            <span>Inicio</span>
          </a>
        </li>
        <li>
          <a
            routerLink="courses"
            routerLinkActive="bg-primary/10 text-primary font-semibold"
            class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
          >
            <span class="material-symbols-outlined text-xl">menu_book</span>
            <span>Cursos</span>
          </a>
        </li>
        <li>
          <a
            routerLink="files"
            routerLinkActive="bg-primary/10 text-primary font-semibold"
            class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
          >
            <span class="material-symbols-outlined text-xl">folder_special</span>
            <span>Archivos</span>
          </a>
        </li>
        <li>
          <a
            routerLink="assignments"
            routerLinkActive="bg-primary/10 text-primary font-semibold"
            class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
          >
            <span class="material-symbols-outlined text-xl">bookmarks</span>
            <span>Asignaciones</span>
          </a>
        </li>
        <li>
          <a
            routerLink="grades"
            routerLinkActive="bg-primary/10 text-primary font-semibold"
            class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
          >
            <span class="material-symbols-outlined text-xl">assignment</span>
            <span>Calificaciones</span>
          </a>
        </li>
        <li>
          <a
            routerLink="groups"
            routerLinkActive="bg-primary/10 text-primary font-semibold"
            class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
          >
            <span class="material-symbols-outlined text-xl">groups</span>
            <span>Grupos</span>
          </a>
        </li>
        <li>
          <a
            routerLink="quizzes"
            routerLinkActive="bg-primary/10 text-primary font-semibold"
            class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
          >
            <span class="material-symbols-outlined text-xl">verified</span>
            <span>Quizzes</span>
          </a>
        </li>
      </ul>

      <!-- Student Section -->
      <div>
        <p class="px-3 py-1.5 text-[11px] uppercase font-semibold text-base-content/50 tracking-wider">Estudiante</p>
        <ul class="space-y-0.5 mt-1">
          <li>
            <a
              routerLink="student/schedule"
              routerLinkActive="bg-primary/10 text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
            >
              <span class="material-symbols-outlined text-xl">event</span>
              <span>Agenda</span>
            </a>
          </li>
          <li>
            <a
              routerLink="student/assignments"
              routerLinkActive="bg-primary/10 text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
            >
              <span class="material-symbols-outlined text-xl">upload_file</span>
              <span>Entregas</span>
            </a>
          </li>
          <li>
            <a
              routerLink="student/notifications"
              routerLinkActive="bg-primary/10 text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
            >
              <span class="material-symbols-outlined text-xl">notifications</span>
              <span>Notificaciones</span>
            </a>
          </li>
          <li>
            <a
              routerLink="student/attendance"
              routerLinkActive="bg-primary/10 text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
            >
              <span class="material-symbols-outlined text-xl">fact_check</span>
              <span>Asistencia</span>
            </a>
          </li>
        </ul>
      </div>

      <!-- Teacher Section -->
      <div>
        <p class="px-3 py-1.5 text-[11px] uppercase font-semibold text-base-content/50 tracking-wider">Docente</p>
        <ul class="space-y-0.5 mt-1">
          <li>
            <a
              routerLink="teacher/attendance"
              routerLinkActive="bg-primary/10 text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
            >
              <span class="material-symbols-outlined text-xl">playlist_add_check</span>
              <span>Tomar asistencia</span>
            </a>
          </li>
          <li>
            <a
              routerLink="teacher/gradebook"
              routerLinkActive="bg-primary/10 text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
            >
              <span class="material-symbols-outlined text-xl">table</span>
              <span>Libro de notas</span>
            </a>
          </li>
          <li>
            <a
              routerLink="teacher/communication"
              routerLinkActive="bg-primary/10 text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
            >
              <span class="material-symbols-outlined text-xl">forum</span>
              <span>Comunicación</span>
            </a>
          </li>
          <li>
            <a
              routerLink="teacher/reports"
              routerLinkActive="bg-primary/10 text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
            >
              <span class="material-symbols-outlined text-xl">assessment</span>
              <span>Reportes</span>
            </a>
          </li>
        </ul>
      </div>

      <!-- Parent Section -->
      <div>
        <p class="px-3 py-1.5 text-[11px] uppercase font-semibold text-base-content/50 tracking-wider">Padres</p>
        <ul class="space-y-0.5 mt-1">
          <li>
            <a
              routerLink="parent/portal"
              routerLinkActive="bg-primary/10 text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
            >
              <span class="material-symbols-outlined text-xl">family_restroom</span>
              <span>Portal</span>
            </a>
          </li>
          <li>
            <a
              routerLink="parent/progress"
              routerLinkActive="bg-primary/10 text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
            >
              <span class="material-symbols-outlined text-xl">bar_chart</span>
              <span>Progreso</span>
            </a>
          </li>
          <li>
            <a
              routerLink="parent/communication"
              routerLinkActive="bg-primary/10 text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
            >
              <span class="material-symbols-outlined text-xl">chat</span>
              <span>Mensajes</span>
            </a>
          </li>
          <li>
            <a
              routerLink="parent/notifications"
              routerLinkActive="bg-primary/10 text-primary font-semibold"
              class="flex items-center gap-3 px-3 py-2 text-base-content/80 rounded-lg transition-all duration-150 hover:bg-base-200 hover:text-base-content group"
            >
              <span class="material-symbols-outlined text-xl">notifications_active</span>
              <span>Alertas</span>
            </a>
          </li>
        </ul>
      </div>
    </nav>`,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {}
