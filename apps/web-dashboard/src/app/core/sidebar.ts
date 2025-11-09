import { Confirmation } from '@/ui';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  Injector,
  OnInit,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorBookBookmarkDuotone,
  phosphorBookmarksSimpleDuotone,
  phosphorBuildingApartmentDuotone,
  phosphorGearFineDuotone,
  phosphorHouseLineDuotone,
  phosphorSealCheckDuotone,
  phosphorSignOutDuotone,
  phosphorUsersFourDuotone,
} from '@ng-icons/phosphor-icons/duotone';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { map } from 'rxjs';
import Auth from '../auth/auth';
import Store from './store';

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
      phosphorGearFineDuotone,
      phosphorSignOutDuotone,
      phosphorUsersFourDuotone,
      phosphorBuildingApartmentDuotone,
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
            <ng-icon name="phosphorSealCheckDuotone" class="text-xl" />
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
      </ul>
      <div>
        <ul class="flex flex-col gap-2 py-6">
          <li>
            <div class="dropdown w-full">
              <div
                role="button"
                tabindex="0"
                class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
              >
                <ng-icon
                  name="phosphorBuildingApartmentDuotone"
                  class="text-xl"
                />
                <span class="ml-3">{{ store.currentSchool()?.name }}</span>
              </div>
              <ul
                tabindex="0"
                class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm"
              >
                @for(school of schools.value(); track school.id) {
                <li>
                  <div
                    (click)="store.currentSchool.set(school)"
                    (keydown)="store.currentSchool.set(school)"
                    tabindex="0"
                  >
                    {{ school.name }}
                  </div>
                </li>
                }
              </ul>
            </div>
          </li>
          @if(auth.isAdmin()) {
          <li>
            <a
              routerLink="admin"
              [routerLinkActive]="[
                'bg-primary/5',
                'text-primary',
                'dark:text-white'
              ]"
              class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
            >
              <ng-icon name="phosphorGearFineDuotone" class="text-xl" />
              <span class="ml-3">Admin</span>
            </a>
          </li>
          }
          <li>
            <button
              class="flex items-center p-2 text-base-content rounded-lg hover:bg-primary-50 hover:text-primary-600 group"
              (click)="logout()"
            >
              <ng-icon name="phosphorSignOutDuotone" class="text-xl" />
              <span class="ml-3">Cerrar sesión</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>`,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar implements OnInit {
  public auth = inject(Auth);
  private confirmation = inject(Confirmation);
  private apollo = inject(Apollo);
  public store = inject(Store);
  private injector = inject(Injector);

  public schools = rxResource({
    stream: () =>
      this.apollo
        .watchQuery<{
          schools: Prisma.SchoolGetPayload<{
            include: undefined;
          }>[];
        }>({
          fetchPolicy: 'cache-and-network',
          query: gql`
            query GetSchools {
              schools {
                id
                name
                organizationId
                shortName
                logo
                address
                city
                state
                zip
                country
                email
                phone
                website
                createdAt
                updatedAt
              }
            }
          `,
        })
        .valueChanges.pipe(map((result) => result.data.schools)),
  });

  ngOnInit() {
    effect(
      () => {
        const schools = this.schools.value();
        if (schools?.length) {
          this.store.currentSchool.set(schools[0]);
        }
      },
      { injector: this.injector }
    );
  }

  public logout() {
    this.confirmation
      .confirm({
        title: 'Cerrar sesión',
        message: '¿Estás seguro de que quieres cerrar sesión?',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.auth.logout();
        }
      });
  }
}
