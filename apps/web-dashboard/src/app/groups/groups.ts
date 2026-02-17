import { EmptyState, Pagination, Paginator } from '@/ui';
import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { map, of, tap } from 'rxjs';
import Store from '../core/store';

type Teacher = Prisma.TeacherGetPayload<undefined> & { name: string };
type GroupType = Prisma.ClassGroupGetPayload<{
  include: {
    studyPlan: { include: { degree: true } };
    courses: { include: { teacher: true; subject: true } };
  };
}> & { teacher?: Teacher };
@Component({
  imports: [RouterLink, DatePipe, EmptyState, Paginator],
  providers: [Pagination],
  template: `<div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Grupos</li>
      </ul>
    </div>
    <h1 class="text-2xl font-semibold">Grupos</h1>
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow-sm mt-4">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Profesor</th>
            <th>Plan de estudio</th>
            <th>Fecha de creación</th>
            <th>Fecha de actualización</th>
          </tr>
        </thead>
        <tbody>
          @for (group of classGroups.value(); track group.id) {
            <tr>
              <td>
                <a class="link link-primary" [routerLink]="[group.id]">{{ group.name }}</a>
              </td>
              <td>{{ group.teacher?.name }}</td>
              <td>{{ group.studyPlan.name }}</td>
              <td>{{ group.createdAt | date: 'short' }}</td>
              <td>{{ group.updatedAt | date: 'short' }}</td>
            </tr>
          } @empty {
            <tr>
              <td colspan="6">
                <lib-empty-state
                  [title]="'No hay grupos'"
                  [description]="'No hay grupos para mostrar'"
                  [icon]="'group'"
                />
              </td>
            </tr>
          }
        </tbody>
      </table>
      <div class="p-4 rounded-b-lg">
        <lib-paginator
          [count]="pagination.count()"
          [take]="pagination.take()"
          [skip]="pagination.skip()"
          (skipChange)="pagination.updateSkip($event)"
          (takeChange)="pagination.updateTake($event)"
        />
      </div>
    </div>`,
})
export default class Groups {
  private store = inject(Store);
  private apollo = inject(Apollo);
  public pagination = inject(Pagination);

  public classGroups = rxResource({
    params: () => ({
      schoolId: this.store.currentSchoolId(),
      take: this.pagination.take(),
      skip: this.pagination.skip(),
    }),
    stream: ({ params }) => {
      const { schoolId } = params;
      if (!schoolId) {
        return of([]);
      }
      return this.apollo
        .watchQuery<{
          classGroups: GroupType[];
          count: number;
        }>({
          query: gql`
            query GetClassGroups($schoolId: String!, $take: Int!, $skip: Int!) {
              count: classGroupsCount(schoolId: $schoolId)
              classGroups(schoolId: $schoolId, take: $take, skip: $skip) {
                id
                name
                createdAt
                updatedAt
                teacherId
                studyPlanId
                teacher {
                  id
                  name
                }
                studyPlan {
                  id
                  name
                }
              }
            }
          `,
          variables: {
            schoolId: params.schoolId,
            take: params.take,
            skip: params.skip,
          },
        })
        .valueChanges.pipe(
          tap((result) => this.pagination.updateCount(result.data.count)),
          map((result) => result.data.classGroups),
        );
    },
  });
}
