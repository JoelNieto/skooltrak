import {
  Breadcrumbs,
  Card,
  Pagination,
  PaginatorV2,
  UiTable,
  UiTableEmpty,
  UiTableError,
  UiTableSkeleton,
  listState,
} from '#/ui';
import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { httpResource } from '@angular/common/http';
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
  imports: [Breadcrumbs, Card, UiTable, UiTableEmpty, UiTableError, UiTableSkeleton, RouterLink, DatePipe, PaginatorV2],
  providers: [Pagination],
  template: `<ui-breadcrumbs [items]="[{ label: 'Inicio', link: '/' }, { label: 'Grupos' }]" />
    <h1 class="text-2xl font-semibold">Grupos</h1>
    <div uiCard class="overflow-x-auto mt-4">
      <table uiTable [attr.aria-busy]="classGroupsResource.isLoading()">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Profesor</th>
            <th>Plan de estudio</th>
            <th>Fecha de creación</th>
            <th>Fecha de actualización</th>
          </tr>
        </thead>
        @switch (classGroupsList.phase()) {
          @case ('skeleton') {
            <tbody uiTableSkeleton [rows]="pageSize()" [columns]="5"></tbody>
          }
          @case ('error') {
            <tbody>
              <tr uiTableError [columns]="5" (retry)="classGroupsResource.reload()"></tr>
            </tbody>
          }
          @case ('ready') {
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
                <tr uiTableEmpty [columns]="5" icon="users" title="Aún no hay grupos"></tr>
              }
            </tbody>
          }
        }
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
  public total = computed(() => this.classGroupsList.rows()?.meta.total ?? 0);
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

  /** class groups with smooth loading: previous rows stay while the next page loads. */
  protected readonly classGroupsList = listState(this.classGroupsResource);

  public classGroups = computed(() =>
    (this.classGroupsList.rows()?.data ?? []).map((g) => ({
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
