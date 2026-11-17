import { Breadcrumbs, Card, EmptyState, Pagination, PaginatorV2, UiTable } from '#/ui';
import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HttpClient, httpResource } from '@angular/common/http';
import { toFetchQueryRecord } from '../core/fetch-query-params';
import { PaginatedResponse } from '../core/pagination-meta';
import Store from '../core/store';

type ClassGroupRow = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  teacher?: { firstName?: string; fatherName?: string; name?: string };
  studyPlan?: { name?: string };
};
@Component({
  imports: [Breadcrumbs, Card, UiTable, RouterLink, DatePipe, EmptyState, PaginatorV2],
  providers: [Pagination],
  template: `<ui-breadcrumbs [items]="[{ label: 'Inicio', link: '/' }, { label: 'Grupos' }]" />
    <h1 class="text-2xl font-semibold">Grupos</h1>
    <div uiCard class="overflow-x-auto mt-4">
      <table uiTable>
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
          @for (group of classGroups(); track group.id) {
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
          [total]="total()"
          [page]="page()"
          [pageSize]="pageSize()"
          (pageChange)="page.set($event)"
          (pageSizeChange)="pageSize.set($event)"
        />
      </div>
    </div>`,
})
export default class Groups {
  private store = inject(Store);
  private http = inject(HttpClient);
  public total = computed(() => this.classGroupsResource.value()?.meta.total ?? 0);
  public page = signal(1);
  public pageSize = signal(10);

  public classGroupsResource = httpResource<PaginatedResponse<ClassGroupRow>>(() => {
    const schoolId = this.store.currentSchoolId();
    if (!schoolId) {
      return undefined;
    }
    return {
      url: '/api/v1/class-groups',
      params: toFetchQueryRecord({
        schoolId,
        page: this.page(),
        pageSize: this.pageSize(),
      }),
    };
  });

  public classGroups = computed(() =>
    this.classGroupsResource.value()?.data.map((g) => ({
      ...g,
      teacher: g.teacher
        ? {
            ...g.teacher,
            name: g.teacher.name ?? `${g.teacher.firstName ?? ''} ${g.teacher.fatherName ?? ''}`.trim(),
          }
        : g.teacher,
    })),
  );
}
