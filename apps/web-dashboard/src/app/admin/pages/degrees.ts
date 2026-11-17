import {
  Button,
  Card,
  Confirmation,
  Icon,
  Modal,
  Paginator,
  Toast,
  UiRowAction,
  UiRowActions,
  UiTable,
  UiTableEmpty,
  UiTableError,
  UiTableSkeleton,
  listState,
} from '#/ui';
import { DatePipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { filter, switchMap } from 'rxjs';
import { toFetchQueryRecord } from '../../core/fetch-query-params';
import Store from '../../core/store';
import DegreesForm from '../forms/degrees-form';

type DegreeRow = {
  id: string;
  name: string;
  shortName: string;
  createdAt: string;
  updatedAt: string;
  school: { name: string };
};
@Component({
  selector: 'app-degrees',
  imports: [
    Card,
    UiTable,
    Button,
    DatePipe,
    Paginator,
    Icon,
    UiRowActions,
    UiTableEmpty,
    UiTableError,
    UiTableSkeleton,
  ],

  template: ` <div class="flex justify-end">
      <button uiButton variant="primary" (click)="editDegree()"><ui-icon name="circle-plus" /> Agregar nivel</button>
    </div>
    <div uiCard class="overflow-x-auto mt-4">
      <table uiTable [attr.aria-busy]="degrees.isLoading()">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Nombre corto</th>
            <th>Escuela</th>
            <th>Fecha de creación</th>
            <th>Fecha de actualización</th>
            <th class="w-12"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        @switch (degreesList.phase()) {
          @case ('skeleton') {
            <tbody uiTableSkeleton [columns]="6"></tbody>
          }
          @case ('error') {
            <tbody>
              <tr uiTableError [columns]="6" (retry)="degrees.reload()"></tr>
            </tbody>
          }
          @case ('ready') {
            <tbody>
              @for (degree of degreesList.rows(); track degree.id) {
                <tr>
                  <td>{{ degree.name }}</td>
                  <td>{{ degree.shortName }}</td>
                  <td>{{ degree.school.name }}</td>
                  <td>{{ degree.createdAt | date: 'short' }}</td>
                  <td>{{ degree.updatedAt | date: 'short' }}</td>
                  <td>
                    <ui-row-actions
                      [actions]="rowActions"
                      [label]="'Acciones para ' + degree.name"
                      (action)="onRowAction($event, degree)"
                    />
                  </td>
                </tr>
              } @empty {
                <tr uiTableEmpty [columns]="6" icon="school" title="Aún no hay niveles"></tr>
              }
            </tbody>
          }
        }
      </table>
      <div class="p-4 rounded-b-lg">
        <lib-paginator
          [count]="pagination().count"
          [take]="pagination().take"
          [skip]="pagination().skip"
          (skipChange)="updateSkip($event)"
          (takeChange)="updateTake($event)"
        />
      </div>
    </div>`,
})
export default class Degrees {
  #http = inject(HttpClient);
  private store = inject(Store);
  private toast = inject(Toast);
  private modal = inject(Modal);
  private confirmation = inject(Confirmation);

  public pagination = signal({
    take: 10,
    skip: 0,
    count: 0,
  });

  public take = computed(() => this.pagination().take);
  public skip = computed(() => this.pagination().skip);

  public updateSkip(skip: number) {
    this.pagination.update((prev) => ({ ...prev, skip }));
  }

  public updateTake(take: number) {
    this.pagination.update((prev) => ({ ...prev, take }));
  }

  public degrees = httpResource<DegreeRow[]>(
    () => {
      const schoolId = this.store.currentSchoolId();
      if (!schoolId) return undefined;
      return {
        url: `/api/v1/degrees/by-school`,
        params: toFetchQueryRecord({
          schoolId,
          take: this.take(),
          skip: this.skip(),
        }),
      };
    },
    { defaultValue: [] },
  );
  /** degrees with smooth loading: previous rows stay while the next page / sort / search loads. */
  protected readonly degreesList = listState(this.degrees);

  #degreesCount = httpResource<number>(() => {
    const schoolId = this.store.currentSchoolId();
    if (!schoolId) return undefined;
    return {
      url: `/api/v1/degrees/count`,
      params: toFetchQueryRecord({ schoolId }),
    };
  });

  constructor() {
    effect(() => {
      const count = this.#degreesCount.value();
      if (count != null) {
        this.pagination.update((prev) => ({ ...prev, count }));
      }
    });
  }

  public editDegree(degree?: DegreeRow) {
    this.modal
      .open(DegreesForm, {
        title: degree ? 'Editar Nivel' : 'Agregar Nivel',
        data: {
          degree,
        },
      })
      .closed.subscribe(() => {
        this.degrees.reload();
      });
  }

  public deleteDegree(degree: DegreeRow) {
    this.confirmation
      .confirm({
        title: 'Eliminar Nivel',
        message: `¿Estás seguro de eliminar el nivel ${degree.name}?`,
      })
      .pipe(
        filter((confirmed: boolean) => confirmed === true),
        switchMap(() => this.#http.delete(`/api/v1/degrees/${degree.id}`)),
      )
      .subscribe({
        next: () => {
          this.degrees.reload();
          this.toast.showSuccess('Nivel eliminado correctamente');
        },
        error: (error) => {
          console.error(error);
          this.toast.showError('Error al eliminar el nivel');
        },
      });
  }

  /** The actions in each row's menu (ui-row-actions). */
  protected readonly rowActions: UiRowAction[] = [
    { id: 'edit', label: 'Editar', icon: 'pencil' },
    { id: 'delete', label: 'Eliminar', icon: 'trash-2', tone: 'danger' },
  ];

  protected onRowAction(action: string, degree: DegreeRow): void {
    switch (action) {
      case 'edit':
        this.editDegree(degree);
        break;
      case 'delete':
        this.deleteDegree(degree);
        break;
    }
  }
}
