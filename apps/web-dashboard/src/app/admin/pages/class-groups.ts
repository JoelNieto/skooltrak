import { Button, Confirmation, EmptyState, Modal, PaginatorV2, Toast, UiSelect } from '#/ui';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { DatePipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, inject, signal, viewChild } from '@angular/core';
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
    UiSelect,
    Button,
    DatePipe,
    RouterLink,
    Menu,
    MenuContent,
    MenuItem,
    MenuTrigger,
    OverlayModule,
    EmptyState,
    PaginatorV2,
    FormField,
  ],
  template: `
    <div class="flex justify-between">
      <div class="flex gap-2">
        <div class="md:w-96 w-full">
          <label class="input input-primary ">
            <span class="material-symbols-outlined">search</span>
            <input class="pl-0" type="search" placeholder="Buscar..." [formField]="form.searchText" />
          </label>
        </div>
        <select uiSelect [formField]="form.studyPlanId">
          <option [value]="''">Elija plan...</option>
          @for (studyPlan of studyPlans.value()?.data; track studyPlan.id) {
            <option [value]="studyPlan.id">{{ studyPlan.name }}</option>
          }
        </select>
      </div>
      <button uiButton variant="primary" (click)="editClassGroup()">
        <span class="material-symbols-outlined">add_circle</span> Nuevo Grupo
      </button>
    </div>
    <div class="overflow-x-auto bg-base-100 rounded-lg border border-base-300 mt-4">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Profesor</th>
            <th>Plan de estudio</th>
            <th>Fecha de creación</th>
            <th>Fecha de actualización</th>
            <th></th>
          </tr>
        </thead>
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
                      <a
                        ngMenuItem
                        value="view"
                        [routerLink]="['/groups', group.id]"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                      >
                        <span class="material-symbols-outlined text-lg">visibility</span>
                        <span>Ver</span>
                      </a>
                      <button
                        ngMenuItem
                        value="edit"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                        (click)="editClassGroup(group)"
                      >
                        <span class="material-symbols-outlined text-lg">edit</span>
                        <span>Editar</span>
                      </button>
                      <button
                        ngMenuItem
                        value="delete"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                        (click)="deleteClassGroup(group.id)"
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
              <td colspan="6" class="text-center">
                <lib-empty-state
                  title="No hay grupos"
                  description="No hay grupos para mostrar"
                  icon="group"
                  actionLabel="Nuevo grupo"
                  (action)="editClassGroup()"
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
    </div>
  `,
})
export default class ClassGroups {
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

  actionsMenu = viewChild<Menu<string>>('actionsMenu');
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
}
