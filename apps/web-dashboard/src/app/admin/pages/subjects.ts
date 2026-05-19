import { Confirmation, Modal, Pagination, Paginator, Toast } from '#/ui';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { DatePipe } from '@angular/common';
import { afterRenderEffect, ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { effect } from '@angular/core';
import { httpResource, HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Prisma } from '@generated/prisma';
import { filter, switchMap } from 'rxjs';
import { toFetchQueryRecord } from '../../core/fetch-query-params';
import SubjectsForm from '../forms/subjects-form';
@Component({
  selector: 'app-subjects',
  imports: [DatePipe, DatePipe, Paginator, FormsModule, Menu, MenuContent, MenuItem, MenuTrigger, OverlayModule],
  providers: [Pagination],

  template: `
    <div class="flex flex-col gap-4 md:flex-row md:justify-between">
      <div class="md:w-96 w-full">
        <label class="input input-primary ">
          <span class="material-symbols-outlined">search</span>
          <input class="pl-0" type="search" placeholder="Buscar..." [(ngModel)]="searchText" />
        </label>
      </div>

      <button class="btn btn-primary" (click)="editSubject()">
        <span class="material-symbols-outlined">add_circle</span> Nueva asignatura
      </button>
    </div>
    <div class="overflow-x-auto bg-base-100 rounded-lg mt-4 border border-base-300">
      <table class="table">
        <thead>
          <tr>
            <th
              class="cursor-pointer hover:bg-base-200 w-1/4"
              [class]="pagination.sortBy() === 'name' ? 'bg-primary/10 !text-primary hover:bg-primary/20' : ''"
              (click)="pagination.setOrder('name')"
            >
              <div class="flex items-center gap-2">
                Nombre
                @if (pagination.sortBy() === 'name') {
                  <span class="material-symbols-outlined text-xl">
                    {{ pagination.sortOrder() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                  </span>
                }
              </div>
            </th>
            <th
              class="hover:bg-base-200 cursor-pointer w-1/5"
              [class]="pagination.sortBy() === 'code' ? 'bg-primary/10 text-primary! hover:bg-primary/20' : ''"
              (click)="pagination.setOrder('code')"
            >
              <div class="flex items-center gap-2">
                Código
                @if (pagination.sortBy() === 'code') {
                  <span class="material-symbols-outlined text-xl">
                    {{ pagination.sortOrder() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                  </span>
                }
              </div>
            </th>
            <th
              class="hover:bg-base-200 cursor-pointer"
              [class]="pagination.sortBy() === 'createdAt' ? 'bg-primary/10 !text-primary hover:bg-primary/20' : ''"
              (click)="pagination.setOrder('createdAt')"
            >
              <div class="flex items-center gap-2">
                Creado
                @if (pagination.sortBy() === 'createdAt') {
                  <span class="material-symbols-outlined text-xl">
                    {{ pagination.sortOrder() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                  </span>
                }
              </div>
            </th>
            <th
              class="hover:bg-base-200 cursor-pointer"
              [class]="pagination.sortBy() === 'updatedAt' ? 'bg-primary/10 !text-primary hover:bg-primary/20' : ''"
              (click)="pagination.setOrder('updatedAt')"
            >
              <div class="flex items-center gap-2">
                Actualizado
                @if (pagination.sortBy() === 'updatedAt') {
                  <span class="material-symbols-outlined text-xl">
                    {{ pagination.sortOrder() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                  </span>
                }
              </div>
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (subject of subjects.value() ?? []; track subject.id) {
            <tr>
              <td>{{ subject.name }}</td>
              <td>{{ subject.code }}</td>
              <td>{{ subject.createdAt | date: 'short' }}</td>
              <td>{{ subject.updatedAt | date: 'short' }}</td>
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
                        (click)="editSubject(subject)"
                      >
                        <span class="material-symbols-outlined text-lg">edit</span>
                        <span>Editar</span>
                      </button>
                      <button
                        ngMenuItem
                        value="Delete"
                        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                        (click)="deleteSubject(subject)"
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
            @if (subjects.isLoading()) {
              <tr>
                <td><div class="skeleton h-4 w-full"></div></td>
                <td><div class="skeleton h-4 w-full"></div></td>
                <td><div class="skeleton h-4 w-full"></div></td>
                <td><div class="skeleton h-4 w-full"></div></td>
                <td><div class="skeleton h-4 w-full"></div></td>
                <td><div class="skeleton h-4 w-full"></div></td>
              </tr>
              <tr>
                <td><div class="skeleton h-4 w-full"></div></td>
                <td><div class="skeleton h-4 w-full"></div></td>
                <td><div class="skeleton h-4 w-full"></div></td>
                <td><div class="skeleton h-4 w-full"></div></td>
                <td><div class="skeleton h-4 w-full"></div></td>
                <td><div class="skeleton h-4 w-full"></div></td>
              </tr>
              <tr>
                <td><div class="skeleton h-4 w-full"></div></td>
                <td><div class="skeleton h-4 w-full"></div></td>
                <td><div class="skeleton h-4 w-full"></div></td>
                <td><div class="skeleton h-4 w-full"></div></td>
                <td><div class="skeleton h-4 w-full"></div></td>
                <td><div class="skeleton h-4 w-full"></div></td>
              </tr>
              <tr>
                <td><div class="skeleton h-4 w-full"></div></td>
                <td><div class="skeleton h-4 w-full"></div></td>
                <td><div class="skeleton h-4 w-full"></div></td>
                <td><div class="skeleton h-4 w-full"></div></td>
                <td><div class="skeleton h-4 w-full"></div></td>
                <td><div class="skeleton h-4 w-full"></div></td>
              </tr>
              <tr>
                <td><div class="skeleton h-4 w-full"></div></td>
                <td><div class="skeleton h-4 w-full"></div></td>
                <td><div class="skeleton h-4 w-full"></div></td>
                <td><div class="skeleton h-4 w-full"></div></td>
                <td><div class="skeleton h-4 w-full"></div></td>
                <td><div class="skeleton h-4 w-full"></div></td>
              </tr>
            } @else {
              <tr>
                <td colspan="6" class="text-center">Sin valores para este filtro</td>
              </tr>
            }
          }
        </tbody>
      </table>
      <div class="p-4 rounded-b-lg ">
        <lib-paginator
          [count]="pagination.count()"
          [take]="pagination.take()"
          [skip]="pagination.skip()"
          (skipChange)="pagination.updateSkip($event)"
          (takeChange)="pagination.updateTake($event)"
        />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Subjects {
  #http = inject(HttpClient);
  #confirmation = inject(Confirmation);
  #modal = inject(Modal);
  #toast = inject(Toast);
  pagination = inject(Pagination);
  searchText = signal('');
  actionsMenu = viewChild<Menu<string>>('actionsMenu');
  public subjects = httpResource<Prisma.SubjectGetPayload<false>[]>(
    () => ({
      url: '/api/v1/subjects',
      params: toFetchQueryRecord({
        take: this.pagination.take(),
        skip: this.pagination.skip(),
        search: this.pagination.search(),
        orderBy: this.pagination.sortBy(),
        orderDirection: this.pagination.sortOrder(),
      }),
    }),
    { defaultValue: [] },
  );

  private readonly subjectsCount = httpResource<number>(() => ({
    url: '/api/v1/subjects/count',
    params: toFetchQueryRecord({
      take: this.pagination.take(),
      skip: this.pagination.skip(),
      search: this.pagination.search(),
      orderBy: this.pagination.sortBy(),
      orderDirection: this.pagination.sortOrder(),
    }),
  }));

  constructor() {
    afterRenderEffect(() => {
      this.pagination.updateSearch(this.searchText());
    });
    effect(() => {
      const count = this.subjectsCount.value();
      if (count != null) {
        this.pagination.updateCount(count);
      }
    });
  }

  public editSubject(subject?: Prisma.SubjectGetPayload<false>) {
    this.#modal
      .open(SubjectsForm, {
        title: subject ? 'Editar Asignatura' : 'Agregar Asignatura',
        data: {
          subject,
        },
      })
      .closed.subscribe(() => {
        this.subjects.reload();
      });
  }

  public deleteSubject(subject: Prisma.SubjectGetPayload<false>) {
    this.#confirmation
      .confirm({
        title: 'Eliminar Asignatura',
        message: `¿Estás seguro de eliminar la asignatura ${subject.name}?`,
      })
      .pipe(
        filter((confirmed: boolean) => confirmed === true),
        switchMap(() => this.#http.delete(`/api/v1/subjects/${subject.id}`)),
      )
      .subscribe({
        next: () => {
          this.subjects.reload();
          this.#toast.showSuccess('Asignatura eliminada correctamente');
        },
        error: (error) => {
          console.error(error);
          this.#toast.showError('Error al eliminar la asignatura');
        },
      });
  }
}
