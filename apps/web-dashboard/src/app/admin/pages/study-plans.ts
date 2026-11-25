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
  listState,
} from '#/ui';
import { DatePipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { debounce, form, FormField } from '@angular/forms/signals';
import { filter, switchMap } from 'rxjs';
import { toFetchQueryRecord } from '../../core/fetch-query-params';
import { PaginatedResponse } from '../../core/pagination-meta';
import Store from '../../core/store';
import StudyPlanDuplicateForm from '../forms/study-plan-duplicate-form';
import StudyPlansBulkForm from '../forms/study-plans-bulk-form';
import StudyPlanForm, { StudyPlanFormRow } from '../forms/study-plans-forms';

type StudyPlanRow = StudyPlanFormRow & {
  degree: { name: string };
  createdAt?: string;
  updatedAt?: string;
};

type DegreeRow = {
  id: string;
  name: string;
};

@Component({
  selector: 'app-study-plans',
  imports: [
    Card,
    UiTable,
    UiSelect,
    Button,
    DatePipe,
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

  template: `<ui-table-toolbar label="Filtrar planes de estudio">
      <label uiInputGroup size="sm">
        <ui-icon name="search" class="text-base text-ink-subtle" />
        <input type="search" placeholder="Buscar plan" aria-label="Buscar plan" [formField]="form.searchText" />
      </label>
      <ui-filter-menu [activeCount]="form.degreeId().value() ? 1 : 0" (clear)="form.degreeId().value.set('')">
        <ui-field label="Nivel">
          <select uiSelect [formField]="form.degreeId">
            <option value="">Todos los niveles</option>
            @for (degree of degrees.value(); track degree.id) {
              <option [value]="degree.id">{{ degree.name }}</option>
            }
          </select>
        </ui-field>
      </ui-filter-menu>
      <button uiToolbarEnd uiButton variant="ghost" size="sm" type="button" (click)="bulkCreate()">
        <ui-icon name="list-ordered" class="text-base" /> Crear varios
      </button>
      <button uiToolbarEnd uiButton variant="primary" size="sm" type="button" (click)="editStudyPlan()">
        <ui-icon name="circle-plus" class="text-base" /> Nuevo plan
      </button>
      @if (form.degreeId().value()) {
        <ng-container uiToolbarChips>
          <ui-filter-chip [label]="'Nivel: ' + selectedDegreeName()" (remove)="form.degreeId().value.set('')" />
        </ng-container>
      }
    </ui-table-toolbar>
    <div uiCard class="mt-4">
      <table uiTable [attr.aria-busy]="studyPlans.isLoading()">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Nombre corto</th>
            <th>Grado</th>
            <th>Nivel</th>
            <th>Creado</th>
            <th>Actualizado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        @switch (studyPlansList.phase()) {
          @case ('skeleton') {
            <tbody uiTableSkeleton [rows]="pageSize()" [columns]="7"></tbody>
          }
          @case ('error') {
            <tbody>
              <tr uiTableError [columns]="7" (retry)="studyPlans.reload()"></tr>
            </tbody>
          }
          @case ('ready') {
            <tbody>
              @for (studyPlan of studyPlansList.rows()?.data; track studyPlan.id) {
                <tr>
                  <td>{{ studyPlan.name }}</td>
                  <td>{{ studyPlan.shortName }}</td>
                  <td>{{ studyPlan.level }}</td>
                  <td>{{ studyPlan.degree.name }}</td>
                  <td>{{ studyPlan.createdAt | date: 'short' }}</td>
                  <td>{{ studyPlan.updatedAt | date: 'short' }}</td>
                  <td>
                    <ui-row-actions
                      [actions]="rowActions"
                      [label]="'Acciones para ' + studyPlan.name"
                      (action)="onRowAction($event, studyPlan)"
                    />
                  </td>
                </tr>
              } @empty {
                @if (form.searchText().value()) {
                  <tr
                    uiTableEmpty
                    [columns]="7"
                    icon="search-x"
                    title="Sin resultados"
                    description="Ningún resultado coincide con la búsqueda."
                  ></tr>
                } @else {
                  <tr uiTableEmpty [columns]="7" icon="clipboard-list" title="Aún no hay planes de estudio"></tr>
                }
              }
            </tbody>
          }
        }
      </table>
      <div class="p-4 rounded-b-lg ">
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
export default class StudyPlans {
  /** Name of the selected filter, for its chip. */
  protected readonly selectedDegreeName = computed(
    () => (this.degrees.value() ?? []).find((x) => x.id === this.form.degreeId().value())?.name ?? '',
  );
  private http = inject(HttpClient);
  private store = inject(Store);
  private toast = inject(Toast);
  private modal = inject(Modal);
  private confirmation = inject(Confirmation);
  searchText = computed(() => this.formModel().searchText);

  formModel = signal<{ searchText: string; degreeId: string }>({ searchText: '', degreeId: '' });

  form = form(this.formModel, (f) => {
    debounce(f.searchText, 400);
  });

  public pagination = computed(() => this.studyPlansList.rows()?.meta);
  total = computed(() => this.pagination()?.total ?? 0);
  public degrees = httpResource<DegreeRow[]>(
    () => {
      const schoolId = this.store.currentSchoolId();
      if (!schoolId) return undefined;
      return {
        url: `/api/v1/degrees/by-school`,
        params: { schoolId },
      };
    },
    { defaultValue: [] },
  );

  pageSize = signal(10);
  page = signal(1);

  public studyPlans = httpResource<PaginatedResponse<StudyPlanRow>>(() => {
    const schoolId = this.store.currentSchoolId();
    const page = this.page();
    const pageSize = this.pageSize();

    if (!schoolId) {
      return undefined;
    }

    return {
      url: '/api/v1/study-plans',
      params: toFetchQueryRecord({
        schoolId,
        page,
        pageSize,
        degreeId: this.form.degreeId().value(),
        search: this.form.searchText().value(),
      }),
    };
  });
  /** studyPlans with smooth loading: previous rows stay while the next page / sort / search loads. */
  protected readonly studyPlansList = listState(this.studyPlans);

  public editStudyPlan(studyPlan?: StudyPlanRow) {
    this.modal
      .open(StudyPlanForm, {
        title: studyPlan ? 'Editar Plan de Estudio' : 'Agregar Plan de Estudio',
        size: 'large',
        data: {
          studyPlan,
          degreeId: this.form.degreeId().value() || undefined,
        },
      })
      .closed.subscribe(() => {
        this.studyPlans.reload();
      });
  }

  /** One plan per grade of a degree, in one step. */
  public bulkCreate() {
    this.modal
      .open(StudyPlansBulkForm, {
        title: 'Crear varios planes de estudio',
        data: { degreeId: this.form.degreeId().value() || undefined },
      })
      .closed.subscribe(() => this.studyPlans.reload());
  }

  /** A copy of the plan, with its courses, as another grade. */
  public duplicateStudyPlan(studyPlan: StudyPlanRow) {
    this.modal
      .open(StudyPlanDuplicateForm, {
        title: 'Duplicar plan de estudio',
        size: 'large',
        data: { studyPlan },
      })
      .closed.subscribe(() => this.studyPlans.reload());
  }

  deleteStudyPlan(studyPlan: StudyPlanRow) {
    this.confirmation
      .confirm({
        title: 'Eliminar Plan de Estudio',
        message: '¿Estás seguro de eliminar este plan de estudio?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      })
      .pipe(
        filter((result) => result === true),
        switchMap(() => this.http.delete(`/api/v1/study-plans/${studyPlan.id}`)),
      )
      .subscribe({
        next: () => {
          this.studyPlans.reload();
          this.toast.showSuccess('Plan de estudio eliminado');
        },
        error: (error) => {
          console.error(error);
          this.toast.showError('Error al eliminar el plan de estudio');
        },
      });
  }

  /** The actions in each row's menu (ui-row-actions). */
  protected readonly rowActions: UiRowAction[] = [
    { id: 'edit', label: 'Editar', icon: 'pencil' },
    { id: 'duplicate', label: 'Duplicar', icon: 'copy' },
    { id: 'delete', label: 'Eliminar', icon: 'trash-2', tone: 'danger' },
  ];

  protected onRowAction(action: string, studyPlan: StudyPlanRow): void {
    switch (action) {
      case 'edit':
        this.editStudyPlan(studyPlan);
        break;
      case 'duplicate':
        this.duplicateStudyPlan(studyPlan);
        break;
      case 'delete':
        this.deleteStudyPlan(studyPlan);
        break;
    }
  }
}
