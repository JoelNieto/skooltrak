import { Loader } from '@/ui';
import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorBookBookmarkDuotone,
  phosphorChalkboardTeacherDuotone,
  phosphorUsersFourDuotone,
} from '@ng-icons/phosphor-icons/duotone';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { catchError, map, of, throwError } from 'rxjs';
import GroupCourses from './group-courses';
import GroupStudents from './group-students';
type Teacher = Prisma.TeacherGetPayload<undefined> & { name: string };
type Student = Prisma.StudentGetPayload<undefined> & {
  name: string;
  initials: string;
};
type GroupType = Prisma.ClassGroupGetPayload<{
  include: {
    studyPlan: { include: { degree: true } };
    courses: { include: { teacher: true; subject: true } };
  };
}> & { teacher?: Teacher; students: Student[] };

@Component({
  imports: [RouterLink, Loader, NgIcon, GroupStudents, GroupCourses],
  viewProviders: [
    provideIcons({
      phosphorChalkboardTeacherDuotone,
      phosphorUsersFourDuotone,
      phosphorBookBookmarkDuotone,
    }),
  ],
  template: `
    @let group = groupResource.value(); @if(groupResource.isLoading()) {
    <lib-loader />
    } @else { @if(group) {
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li><a routerLink="/groups">Grupos</a></li>
        <li>{{ group.name }}</li>
      </ul>
    </div>
    <h1 class="text-2xl  font-semibold">{{ group.name }}</h1>
    <h3 class="text-lg text-base-200">
      {{ group.studyPlan.name }} / {{ group.studyPlan.degree.name }}
    </h3>
    <p class="flex items-center gap-2">
      <ng-icon name="phosphorChalkboardTeacherDuotone" />{{
        group.teacher?.name
      }}
    </p>
    <div class="tabs tabs-box mt-4">
      <label class="tab">
        <input type="radio" name="my_tabs_1" class="tab" checked />
        <ng-icon name="phosphorUsersFourDuotone" /> Estudiantes
      </label>

      <div class="tab-content bg-base-100 border-base-300 p-6">
        <app-group-students [students]="group.students" />
      </div>
      <label class="tab">
        <input type="radio" name="my_tabs_1" class="tab" />
        <ng-icon name="phosphorBookBookmarkDuotone" /> Cursos
      </label>

      <div class="tab-content bg-base-100 border-base-300 p-6">
        <app-group-courses [courses]="group.courses" />
      </div>
      <input type="radio" name="my_tabs_1" class="tab" aria-label="Tab 3" />
      <div class="tab-content bg-base-100 border-base-300 p-6">
        Tab content 3
      </div>
    </div>
    } @else {
    <div>No group found</div>
    } }
  `,
})
export default class Group {
  public id = input.required<string>();
  private apollo = inject(Apollo);

  public groupResource = rxResource({
    params: () => ({
      id: this.id(),
    }),
    stream: ({ params }) => {
      const { id } = params;
      if (!id) {
        return of(null);
      }

      return this.apollo
        .watchQuery<{
          classGroup: GroupType;
        }>({
          query: gql`
            query ClassGroup($id: String!) {
              classGroup(id: $id) {
                id
                name
                shortName
                createdAt
                updatedAt
                teacherId
                studyPlanId
                students {
                  id
                  name
                  email
                  documentId
                  initials
                }
                courses {
                  id
                  name
                  code
                  subject {
                    id
                    name
                  }
                  teacher {
                    id
                    name
                    initials
                  }
                }
                teacher {
                  id
                  name
                }
                studyPlan {
                  id
                  name
                  degree {
                    id
                    name
                  }
                }
              }
            }
          `,
          variables: {
            id,
          },
        })
        .valueChanges.pipe(
          map((result) => result.data.classGroup),
          catchError((err) => {
            console.log(err);
            return throwError(() => err);
          })
        );
    },
  });
}
