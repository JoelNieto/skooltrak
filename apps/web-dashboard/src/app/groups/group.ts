import { Loader } from '@/ui';
import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Apollo } from 'apollo-angular';
import { ClassGroupDocument } from '../graphql/generated/graphql';
import { catchError, map, of, throwError } from 'rxjs';
import { isValidId } from '../core/validators';
import Auth from '../auth/auth';
import GroupCourses from './group-courses';
import GroupHabits from './group-habits';
import GroupSchedule from './group-schedule';
import GroupStudents from './group-students';

@Component({
  imports: [RouterLink, Loader, GroupStudents, GroupCourses, GroupSchedule, GroupHabits],
  viewProviders: [],
  template: `
    @let group = groupResource.value(); @if(groupResource.isLoading()) {
    <lib-loader />
    } @else { @if(group && group.id) {
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li><a routerLink="/groups">Grupos</a></li>
        <li>{{ group.name }}</li>
      </ul>
    </div>
    <div class="card card-border border-base-300 bg-base-100">
      <div class="card-body flex flex-row justify-between items-center">
        <div>
          <h1 class="text-xl  font-semibold">{{ group.name }}</h1>
          <h3 class="text-base-200">
            {{ group.studyPlan?.name }} / {{ group.studyPlan?.degree?.name }}
          </h3>
          <div class="flex items-center gap-2">
            <div class="avatar avatar-placeholder">
              <div
                class="text-white w-7 rounded-full"
                [style.background]="group.teacher?.color"
              >
                <span class="text-xs">{{ group.teacher?.initials }}</span>
              </div>
            </div>
            {{ group.teacher?.name }}
          </div>
        </div>
        <div></div>
      </div>
    </div>

    <div class="tabs tabs-box mt-4">
      <label class="tab">
        <input type="radio" name="my_tabs_1" class="tab" checked />
        <span class="flex items-center gap-2">
          <span class="material-symbols-outlined text-xl">group</span>
          Estudiantes</span
        >
      </label>

      <div class="tab-content bg-base-100 border-base-300 p-6">
        <app-group-students [students]="$any(group.students ?? [])" />
      </div>
      <label class="tab">
        <input type="radio" name="my_tabs_1" class="tab" />
        <span class="flex items-center gap-2">
          <span class="material-symbols-outlined text-xl">menu_book</span>
          Cursos
        </span>
      </label>

      <div class="tab-content bg-base-100 border-base-300 p-6">
        <app-group-courses [courses]="$any(group.courses ?? [])" />
      </div>
      <label class="tab">
        <input type="radio" name="my_tabs_1" class="tab" />
        <span class="flex items-center gap-2">
          <span class="material-symbols-outlined text-xl">calendar_month</span>
          Horario
        </span>
      </label>
      <div class="tab-content bg-base-100 border-base-300 p-6">
        <app-group-schedule [id]="id()" />
      </div>
      @if (canManageHabits()) {
      <label class="tab">
        <input type="radio" name="my_tabs_1" class="tab" />
        <span class="flex items-center gap-2">
          <span class="material-symbols-outlined text-xl">psychology</span>
          Hábitos y actitudes
        </span>
      </label>
      <div class="tab-content bg-base-100 border-base-300 p-6">
        <app-group-habits [groupId]="id()" [students]="$any(group.students ?? [])" />
      </div>
      }
    </div>
    } @else {
    <div>No group found</div>
    } }
  `,
})
export default class Group {
  public id = input.required<string>();
  private apollo = inject(Apollo);
  private auth = inject(Auth);

  // Check if current user can manage habits for this group
  public canManageHabits = computed(() => {
    const user = this.auth.userResource.value();
    const group = this.groupResource.value();

    if (!user || !group) return false;

    // Allow admins
    if (this.auth.isAdmin()) return true;

    // Allow if user is the teacher of this group
    return group.teacher?.user?.id === user.id;
  });

  public groupResource = rxResource({
    params: () => ({
      id: this.id(),
    }),
    stream: ({ params }) => {
      const { id } = params;
      if (!isValidId(id)) {
        return of(null);
      }

      return this.apollo
        .watchQuery({
          query: ClassGroupDocument,
          variables: { id },
        })
        .valueChanges.pipe(
          map((result) => result.data?.classGroup),
          catchError((err) => {
            console.log(err);
            return throwError(() => err);
          })
        );
    },
  });
}
