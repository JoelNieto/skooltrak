import { EmptyState, Pagination, Paginator } from '#/ui';
import { DatePipe } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { HttpClient } from '@angular/common/http';
import { forkJoin, map, of, tap } from 'rxjs';
import Store from '../core/store';
import { toFetchQueryParams } from '../core/fetch-query-params';

@Component({
  imports: [RouterLink, DatePipe, EmptyState, Paginator],
  providers: [Pagination],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Grupos</li>
      </ul>
    </div>
    <h1 class="text-2xl font-semibold">Grupos</h1>
    <div class="overflow-x-auto bg-base-100 rounded-lg mt-4">
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
              <td>{{ group.studyPlan?.name }}</td>
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
  private http = inject(HttpClient);
  public pagination = inject(Pagination);

  public classGroups = rxResource({
    params: () => ({
      schoolId: this.store.currentSchoolId(),
      take: this.pagination.take(),
      skip: this.pagination.skip(),
    }),
    stream: ({ params }) => {
      const { schoolId, take, skip } = params;
      if (!schoolId) {
        return of([]);
      }
      const q = toFetchQueryParams({ schoolId, take, skip });
      return forkJoin({
        count: this.http.get<number>('/api/v1/class-groups/count', { params: q }),
        list: this.http.get<
          Array<{
            id: string;
            name: string;
            createdAt: string;
            updatedAt: string;
            teacher?: { firstName?: string; fatherName?: string; name?: string };
            studyPlan?: { name?: string };
          }>
        >('/api/v1/class-groups', { params: q }),
      }).pipe(
        tap(({ count }) => this.pagination.updateCount(count ?? 0)),
        map(({ list }) =>
          (list ?? []).map((g) => ({
            ...g,
            teacher: g.teacher
              ? {
                  ...g.teacher,
                  name: g.teacher.name ?? `${g.teacher.firstName ?? ''} ${g.teacher.fatherName ?? ''}`.trim(),
                }
              : g.teacher,
          })),
        ),
      );
    },
  });
}
