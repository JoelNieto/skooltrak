import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  Injector,
  OnInit,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorHouseLineBold } from '@ng-icons/phosphor-icons/bold';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { map } from 'rxjs';
import { Store } from './store';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, RouterOutlet, RouterLinkActive, NgIcon],
  viewProviders: [provideIcons({ phosphorHouseLineBold })],
  template: `<nav class="navbar bg-base-100 border-b border-base-200">
      <div class="navbar-start">
        <div class="dropdown">
          <div tabindex="0" role="button" class="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </div>
          <ul
            tabindex="-1"
            class="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
          >
            <li><a routerLink="/home">Inicio</a></li>
            <li><a routerLink="/courses">Cursos</a></li>
            <li><a routerLink="/assignments">Asignaciones</a></li>
            <li><a routerLink="/grades">Calificaciones</a></li>
          </ul>
        </div>
        <a class="btn btn-ghost text-xl"
          ><img src="skooltrak.png" alt="Logo" class="h-8" routerLink="/"
        /></a>
      </div>
      <div class="navbar-center hidden lg:flex">
        <ul class="menu menu-horizontal px-1 gap-2">
          <li>
            <a
              routerLink="/home"
              routerLinkActive="bg-primary text-primary-content font-semibold"
            >
              <ng-icon name="phosphorHouseLineBold" />Inicio</a
            >
          </li>
          <li>
            <a
              routerLink="/courses"
              routerLinkActive="bg-primary text-primary-content font-semibold"
              >Cursos</a
            >
          </li>
          <li>
            <a
              routerLink="/assignments"
              routerLinkActive="bg-primary text-primary-content font-semibold"
              >Asignaciones</a
            >
          </li>
          <li>
            <a
              routerLink="/grades"
              routerLinkActive="bg-primary text-primary-content font-semibold"
              >Calificaciones</a
            >
          </li>
        </ul>
      </div>
      <div class="navbar-end">
        <div class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="btn btn-ghost">
            {{ store.currentSchool()?.name }}
          </div>

          <ul
            class="menu dropdown-content dr bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
          >
            @for (school of schools.value(); track school.id) {
            <li>
              <div
                (click)="store.currentSchool.set(school)"
                class="cursor-pointer"
                tabindex="0"
                role="button"
                (keydown.enter)="store.currentSchool.set(school)"
              >
                {{ school.name }}
              </div>
            </li>
            }
          </ul>
        </div>
      </div>
    </nav>
    <main class="p-4 w-full max-w-screen-xl mx-auto">
      <router-outlet />
    </main>`,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Dashboard implements OnInit {
  public store = inject(Store);
  private apollo = inject(Apollo);
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

  ngOnInit(): void {
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
}
