import {
  Button,
  Card,
  Confirmation,
  Icon,
  Modal,
  PaginatorV2,
  Toast,
  UiField,
  UiFilterChip,
  UiFilterMenu,
  UiInputGroup,
  UiRowAction,
  UiRowActions,
  UiSelect,
  UiTable,
  UiTableEmpty,
  UiTableError,
  UiTableSkeleton,
  UiTableToolbar,
} from '#/ui';
import { DatePipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { debounce, form, FormField } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { filter, switchMap } from 'rxjs';
import { toFetchQueryRecord } from '../../core/fetch-query-params';
import { PaginatedResponse } from '../../core/pagination-meta';
import Store from '../../core/store';
import ClassGroupsForm from '../forms/class-groups-form';

type ClassGroupRow = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  teacher?: { firstName?: string; fatherName?: string };
  studyPlan: { name: string };
};

type StudyPlanRow = {
  id: string;
  name: string;
};

@Component({
  selector: 'app-groups',
  imports: [
    Card,
    UiTable,
    UiSelect,
    Button,
    DatePipe,
    RouterLink,
    PaginatorV2,
    FormField,
    UiInputGroup,
    Icon,
    UiRowActions,
    UiTableEmpty,
    UiTableError,
    UiTableSkeleton,
    UiField,
    UiFilterChip,
    UiFilterMenu,
    UiTableToolbar,
  ],
  template: `
    <ui-table-toolbar label="Filtrar grupos">
      <label uiInputGroup size="sm">
        <ui-icon name="search" class="text-base text-ink-subtle" />
        <input type="search" placeholder="Buscar grupo" aria-label="Buscar grupo" [formField]="form.searchText" />
      </label>
      <ui-filter-menu [activeCount]="form.studyPlanId().value() ? 1 : 0" (clear)="form.studyPlanId().value.set('')">
        <ui-field label="Plan de estudios">
          <select uiSelect [formField]="form.studyPlanId">
            <option value="">Todos los planes</option>
            @for (studyPlan of studyPlans.value()?.data; track studyPlan.id) {
              <option [value]="studyPlan.id">{{ studyPlan.name }}</option>
            }
          </select>
        </ui-field>
      </ui-filter-menu>
      <button uiToolbarEnd uiButton variant="primary" size="sm" type="button" (click)="editClassGroup()">
        <ui-icon name="circle-plus" class="text-base" /> Nuevo grupo
      </button>
      @if (form.studyPlanId().value()) {
        <ng-container uiToolbarChips>
          <ui-filter-chip [label]="'Plan: ' + selectedStudyPlanName()" (remove)="form.studyPlanId().value.set('')" />
        </ng-container>
      }
    </ui-table-toolbar>
    <div uiCard class="overflow-x-auto mt-4">
      <table uiTable [attr.aria-busy]="classGroups.isLoading()">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Profesor</th>
            <th>Plan de estudio</th>
            <th>Fecha de creación</th>
            <th>Fecha de actualización</th>
            <th class="w-12"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        @if (classGroups.isLoading() && !classGroups.hasValue()) {
          <tbody uiTableSkeleton [columns]="6"></tbody>
        } @else if (classGroups.error()) {
          <tbody>
            <tr uiTableError [columns]="6" (retry)="classGroups.reload()"></tr>
          </tbody>
        } @else {
          <tbody>
            @for (group of classGroups.value()?.data; track group.id) {
              <tr>
                <td>
                  <a class="link link-primary" [routerLink]="['/groups', group.id]">{{ group.name }}</a>
                </td>
                <td>
                  @if (group.teacher) {
                    {{ group.teacher.firstName }} {{ group.teacher.fatherName }}
                  } @else {
                    --
                  }
                </td>
                <td>{{ group.studyPlan.name }}</td>
                <td>{{ group.createdAt | date: 'short' }}</td>
                <td>{{ group.updatedAt | date: 'short' }}</td>
                <td>
                  <ui-row-actions
                    [actions]="rowActions(group)"
                    [label]="'Acciones para ' + group.name"
                    (action)="onRowAction($event, group)"
                  />
                </td>
              </tr>
            } @empty {
              @if (form.searchText().value()) {
                <tr
                  uiTableEmpty
                  [columns]="6"
                  icon="search-x"
                  title="Sin resultados"
                  description="Ningún resultado coincide con la búsqueda."
                ></tr>
              } @else {
                <tr uiTableEmpty [columns]="6" icon="users" title="Aún no hay grupos"></tr>
              }
            }
          </tbody>
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
    </div>
  `,
})
export default class ClassGroups {
  /** Name of the selected filter, for its chip. */
  protected readonly selectedStudyPlanName = computed(
    () => (this.studyPlans.value()?.data ?? []).find((x) => x.id === this.form.studyPlanId().value())?.name ?? '',
  );
  private modal = inject(Modal);
  private http = inject(HttpClient);
  private store = inject(Store);
  private confirmation = inject(Confirmation);
  private toasts = inject(Toast);
  private formModel = signal<{ searchText: string; teacherId: string; studyPlanId: string }>({
    searchText: '',
    teacherId: '',
    studyPlanId: '',
  });

  public form = form(this.formModel, (f) => {
    // Add validation rules here if needed
    debounce(f.searchText, 400);
  });

  pageSize = signal(10);
  page = signal(1);
  total = computed(() => this.classGroups.value()?.meta?.total ?? 0);

  public classGroups = httpResource<PaginatedResponse<ClassGroupRow>>(() => {
    const schoolId = this.store.currentSchoolId();
    const page = this.page();
    const pageSize = this.pageSize();
    if (!schoolId) {
      return undefined;
    }
    return {
      url: '/api/v1/class-groups',
      params: toFetchQueryRecord({
        schoolId,
        page,
        pageSize,
        search: this.form.searchText().value(),
        teacherId: this.form.teacherId().value(),
        studyPlanId: this.form.studyPlanId().value(),
      }),
    };
  });

  public studyPlans = httpResource<PaginatedResponse<StudyPlanRow>>(() => {
    const schoolId = this.store.currentSchoolId();

    if (!schoolId) {
      return undefined;
    }

    return {
      url: '/api/v1/study-plans',
      params: toFetchQueryRecord({
        schoolId,
        page: 1,
        pageSize: 50,
      }),
    };
  });

  public editClassGroup(group?: ClassGroupRow) {
    this.modal
      .open(ClassGroupsForm, {
        title: group ? 'Editar grupo' : 'Nuevo grupo',
        data: {
          group,
        },
      })
      .closed.subscribe(() => {
        this.classGroups.reload();
      });
  }

  public deleteClassGroup(id: string) {
    this.confirmation
      .confirm({
        title: 'Eliminar grupo',
        message: '¿Estás seguro de eliminar este grupo?',
      })
      .pipe(
        filter((result) => result),
        switchMap(() => this.http.delete(`/api/v1/class-groups/${id}`)),
      )
      .subscribe(() => {
        this.toasts.showSuccess('Grupo eliminado correctamente');
        this.classGroups.reload();
      });
  }

  /** The actions in each row's menu (ui-row-actions). */
  protected rowActions(group: ClassGroupRow): UiRowAction[] {
    return [
      { id: 'view', label: 'Ver', icon: 'eye', link: ['/groups', group.id] },
      { id: 'edit', label: 'Editar', icon: 'pencil' },
      { id: 'delete', label: 'Eliminar', icon: 'trash-2', tone: 'danger' },
    ];
  }

  protected onRowAction(action: string, group: ClassGroupRow): void {
    switch (action) {
      case 'edit':
        this.editClassGroup(group);
        break;
      case 'delete':
        this.deleteClassGroup(group.id);
        break;
    }
  }
}
