import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorBookBookmarkDuotone,
  phosphorBookmarksSimpleDuotone,
  phosphorBuildingApartmentDuotone,
  phosphorExamDuotone,
  phosphorHouseLineDuotone,
  phosphorSealCheckDuotone,
  phosphorUsersFourDuotone,
} from '@ng-icons/phosphor-icons/duotone';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[appSidebar]',
  imports: [RouterLink, RouterLinkActive, NgIcon],
  viewProviders: [
    provideIcons({
      phosphorHouseLineDuotone,
      phosphorBookBookmarkDuotone,
      phosphorBookmarksSimpleDuotone,
      phosphorSealCheckDuotone,
      phosphorUsersFourDuotone,
      phosphorBuildingApartmentDuotone,
      phosphorExamDuotone,
    }),
  ],
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
            <ng-icon name="phosphorHouseLineDuotone" class="text-xl" />
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
            <ng-icon name="phosphorBookBookmarkDuotone" class="text-xl" />
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
            <ng-icon name="phosphorBookmarksSimpleDuotone" class="text-xl" />
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
            <ng-icon name="phosphorExamDuotone" class="text-xl" />
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
            <ng-icon name="phosphorUsersFourDuotone" class="text-xl" />
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
            <ng-icon name="phosphorSealCheckDuotone" class="text-xl" />

            <span class="ml-3">Quizes</span>
          </a>
        </li>
      </ul>
    </nav>`,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {}
