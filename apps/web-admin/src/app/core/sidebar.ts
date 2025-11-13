import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorBuildingOfficeDuotone,
  phosphorFolderSimpleLockDuotone,
  phosphorHouseLineDuotone,
  phosphorTableDuotone,
  phosphorTreeViewDuotone,
  phosphorUserGearDuotone,
  phosphorUsersThreeDuotone,
} from '@ng-icons/phosphor-icons/duotone';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[appSidebar]',
  imports: [RouterLink, RouterLinkActive, NgIcon],
  viewProviders: [
    provideIcons({
      phosphorHouseLineDuotone,
      phosphorBuildingOfficeDuotone,
      phosphorUserGearDuotone,
      phosphorFolderSimpleLockDuotone,
      phosphorUsersThreeDuotone,
      phosphorTreeViewDuotone,
      phosphorTableDuotone,
    }),
  ],
  template: `<div class="flex items-center justify-between px-4 pt-4 pb-2">
      <h1 class="text-xl font-semibold text-primary flex items-center gap-2">
        SkoolTrak
      </h1>
    </div>
    <nav class="p-2 flex flex-col justify-between gap-8 flex-1 h-full">
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
            <ng-icon name="phosphorHouseLineDuotone" class="text-xl" />
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
            <ng-icon name="phosphorTreeViewDuotone" class="text-xl" />
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
            <ng-icon name="phosphorBuildingOfficeDuotone" class="text-xl" />
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
            <ng-icon name="phosphorUserGearDuotone" class="text-xl" />
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
            <ng-icon name="phosphorTableDuotone" class="text-xl" />
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
            <ng-icon name="phosphorFolderSimpleLockDuotone" class="text-xl" />
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
            <ng-icon name="phosphorUsersThreeDuotone" class="text-xl" />
            <span class="ml-3">Usuarios</span>
          </a>
        </li>
      </ul>
    </nav>`,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {}
