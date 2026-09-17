import { Confirmation, EmptyState, Modal, PaginatorV2, Toast } from '#/ui';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { DatePipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { debounce, form, FormField } from '@angular/forms/signals';
import { filter, switchMap } from 'rxjs';
import { toFetchQueryRecord } from '../../core/fetch-query-params';
import { PaginatedResponse } from '../../core/pagination-meta';
import Store from '../../core/store';
import StudyPlanForm from '../forms/study-plans-forms';

type StudyPlanRow = {
  id: string;
  name: string;
  shortName?: string;
  level?: number;
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
  imports: [DatePipe, Menu, PaginatorV2, MenuContent, MenuItem, MenuTrigger, OverlayModule, FormField, EmptyState],

  template: `<div class="flex justify-between">
      <div class="flex gap-2">
        <div class="md:w-96 w-full">
          <label class="input input-primary ">
            <span class="material-symbols-outlined">search</span>
            <input class="pl-0" type="search" placeholder="Buscar..." [formField]="form.searchText" />
          </label>
        </div>
        <select class="select select-primary" [formField]="form.degreeId">
          <option [value]="''">Elija nivel...</option>
          @for (degree of degrees.value(); track degree.id) {
            <option [value]="degree.id">{{ degree.name }}</option>
          }
        </select>
      </div>
      <button class="btn btn-primary" (click)="editStudyPlan()">
        <span class="material-symbols-outlined">add_circle</span> Nuevo plan
      </button>
    </div>
    <div class="bg-base-100 rounded-lg border border-base-300 mt-4">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Nombre corto</th>
            <th>Nivel</th>
            <th>Grado</th>
            <th>Creado</th>
            <th>Actualizado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (studyPlan of studyPlans.value()?.data; track studyPlan.id) {
            <tr>
              <td>{{ studyPlan.name }}</td>
              <td>{{ studyPlan.shortName }}</td>
              <td>{{ studyPlan.level }}</td>
              <td>{{ studyPlan.degree.name }}</td>
              <td>{{ studyPlan.createdAt | date: 'short' }}</td>
              <td>{{ studyPlan.updatedAt | date: 'short' }}</td>
              <td>
                <button
                  class="cursor-pointer hover:bg-base-200 p-1 rounded-lg flex items-center justify-center"
                  ngMenuTrigger
                  #origin
                  #trigger="ngMenuTrigger"
                  [menu]="actionsMenu()"
                >
                  <span class="material-symbols-outlined text-xl">more_horiz</span>
                </button>
                <ng-template
                  [cdkConnectedOverlayOpen]="trigger.expanded()"
                  [cdkConnectedOverlay]="{ origin, usePopover: 'inline' }"
                  [cdkConnectedOverlayPositions]="[
                    {
                      originX: 'end',
                      originY: 'bottom',
                      overlayX: 'end',
                      overlayY: 'top',
                      offsetY: 4,
                    },
                  ]"
                  cdkAttachPopoverAsChild
                >
                  <div ngMenu class="bg-base-100 shadow-sm rounded-lg p-1 w-48" #actionsMenu="ngMenu">
                    <ng-template ngMenuContent>
                      <button
                        ngMenuItem
                        value="Edit"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                        (click)="editStudyPlan(studyPlan)"
                      >
                        <span class="material-symbols-outlined text-lg">edit</span>
                        <span>Editar</span>
                      </button>
                      <button
                        ngMenuItem
                        value="Delete"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                        (click)="deleteStudyPlan(studyPlan)"
                      >
                        <span class="material-symbols-outlined text-lg">delete</span>
                        <span>Eliminar</span>
                      </button>
                    </ng-template>
                  </div>
                </ng-template>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="7">
                <lib-empty-state
                  [title]="'No hay planes de estudio'"
                  [description]="'No hay planes de estudio para mostrar'"
                  [icon]="'group'"
                />
              </td>
            </tr>
          }
        </tbody>
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
  private http = inject(HttpClient);
  private store = inject(Store);
  private toast = inject(Toast);
  private modal = inject(Modal);
  private confirmation = inject(Confirmation);
  searchText = computed(() => this.formModel().searchText);
  actionsMenu = viewChild<Menu<string>>('actionsMenu');

  formModel = signal<{ searchText: string; degreeId: string }>({ searchText: '', degreeId: '' });

  form = form(this.formModel, (f) => {
    debounce(f.searchText, 400);
  });

  public pagination = computed(() => this.studyPlans.value()?.meta);
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

  public editStudyPlan(studyPlan?: StudyPlanRow) {
    this.modal
      .open(StudyPlanForm, {
        title: studyPlan ? 'Editar Plan de Estudio' : 'Agregar Plan de Estudio',
        size: 'large',
        data: {
          studyPlan,
        },
      })
      .closed.subscribe(() => {
        this.studyPlans.reload();
      });
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
}
