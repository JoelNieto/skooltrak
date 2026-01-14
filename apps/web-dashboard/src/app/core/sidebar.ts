import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';


@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[appSidebar]',
  imports: [RouterLink, RouterLinkActive],
  template: `<div class="flex items-center justify-between px-4 py-4">
      <h1 class="text-xl font-semibold text-primary flex items-center gap-2">
        <img src="skooltrak.png" alt="Skooltrak" class="h-8" />
      </h1>
    </div>
    <nav class="p-2 flex flex-col justify-between gap-8 flex-1 h-full">
      <ul class="space-y-4">
        <li>
          <a
            routerLink="home"
            [routerLinkActive]="[
              'bg-primary/5',
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
            routerLink="courses"
            [routerLinkActive]="[
              'bg-primary/5',
              'text-primary',
              'dark:text-white'
            ]"
            class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
          >
            <span class="material-symbols-outlined text-xl">menu_book</span>
            <span class="ml-3">Cursos</span>
          </a>
        </li>
        <li>
          <a
            routerLink="assignments"
            [routerLinkActive]="[
              'bg-primary/5',
              'text-primary',
              'dark:text-white'
            ]"
            class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
          >
            <span class="material-symbols-outlined text-xl">bookmarks</span>
            <span class="ml-3">Asignaciones</span>
          </a>
        </li>
        <li>
          <a
            routerLink="grades"
            [routerLinkActive]="[
              'bg-primary/5',
              'text-primary',
              'dark:text-white'
            ]"
            class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
          >
            <span class="material-symbols-outlined text-xl">assignment</span>
            <span class="ml-3">Calificaciones</span>
          </a>
        </li>
        <li>
          <a
            routerLink="groups"
            [routerLinkActive]="[
              'bg-primary/5',
              'text-primary',
              'dark:text-white'
            ]"
            class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
          >
            <span class="material-symbols-outlined text-xl">groups</span>
            <span class="ml-3">Grupos</span>
          </a>
        </li>
        <li>
          <a
            routerLink="quizzes"
            [routerLinkActive]="[
              'bg-primary/5',
              'text-primary',
              'dark:text-white'
            ]"
            class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
          >
            <span class="material-symbols-outlined text-xl">verified</span>

            <span class="ml-3">Quizes</span>
          </a>
        </li>
      </ul>
    </nav>`,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {}
