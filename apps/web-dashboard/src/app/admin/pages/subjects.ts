import { Confirmation, Modal, Pagination, Paginator, Toast } from '@/ui';
import { DatePipe } from '@angular/common';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Prisma } from '@generated/prisma';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorMagnifyingGlassDuotone,
  phosphorPencilDuotone,
  phosphorPlusCircleDuotone,
  phosphorSortAscendingDuotone,
  phosphorSortDescendingDuotone,
  phosphorTrashDuotone,
} from '@ng-icons/phosphor-icons/duotone';
import { Apollo, gql } from 'apollo-angular';
import { filter, map, switchMap, tap } from 'rxjs';
import SubjectsForm from '../forms/subjects-form';
@Component({
  selector: 'app-subjects',
  imports: [DatePipe, NgIcon, Paginator, FormsModule],
  providers: [Pagination],
  viewProviders: [
    provideIcons({
      phosphorPencilDuotone,
      phosphorTrashDuotone,
      phosphorPlusCircleDuotone,
      phosphorMagnifyingGlassDuotone,
      phosphorSortAscendingDuotone,
      phosphorSortDescendingDuotone,
    }),
  ],
  template: `
    <div class="flex flex-col gap-4 md:flex-row md:justify-between">
      <div class="md:w-96 w-full">
        <label class="input input-primary ">
          <ng-icon name="phosphorMagnifyingGlassDuotone" />
          <input
            class="pl-0"
            type="search"
            placeholder="Buscar..."
            [(ngModel)]="searchText"
          />
        </label>
      </div>

      <button class="btn btn-primary" (click)="editSubject()">
        <ng-icon name="phosphorPlusCircleDuotone" /> Nueva asignatura
      </button>
    </div>
    <div
      class="overflow-x-auto bg-base-100 rounded-lg mt-4 border border-base-300"
    >
      <table class="table">
        <thead>
          <tr>
            <th
              class="cursor-pointer hover:bg-base-200"
              [class]="
                pagination.sortBy() === 'name'
                  ? 'bg-primary/10 !text-primary hover:bg-primary/20'
                  : ''
              "
              (click)="pagination.setOrder('name')"
            >
              <div class="flex items-center gap-2">
                Nombre @if(pagination.sortBy() === 'name') {
                <ng-icon
                  [name]="
                    pagination.sortOrder() === 'asc'
                      ? 'phosphorSortAscendingDuotone'
                      : 'phosphorSortDescendingDuotone'
                  "
                  class="text-xl"
                />}
              </div>
            </th>
            <th
              class="hover:bg-base-200 cursor-pointer"
              [class]="
                pagination.sortBy() === 'shortName'
                  ? 'bg-primary/10 !text-primary hover:bg-primary/20'
                  : ''
              "
              (click)="pagination.setOrder('shortName')"
            >
              <div class="flex items-center gap-2">
                Nombre corto @if(pagination.sortBy() === 'shortName') {
                <ng-icon
                  [name]="
                    pagination.sortOrder() === 'asc'
                      ? 'phosphorSortAscendingDuotone'
                      : 'phosphorSortDescendingDuotone'
                  "
                  class="text-xl"
                />}
              </div>
            </th>
            <th
              class="hover:bg-base-200 cursor-pointer"
              [class]="
                pagination.sortBy() === 'code'
                  ? 'bg-primary/10 !text-primary hover:bg-primary/20'
                  : ''
              "
              (click)="pagination.setOrder('code')"
            >
              <div class="flex items-center gap-2">
                Código @if(pagination.sortBy() === 'code') {
                <ng-icon
                  [name]="
                    pagination.sortOrder() === 'asc'
                      ? 'phosphorSortAscendingDuotone'
                      : 'phosphorSortDescendingDuotone'
                  "
                  class="text-xl"
                />}
              </div>
            </th>
            <th
              class="hover:bg-base-200 cursor-pointer"
              [class]="
                pagination.sortBy() === 'createdAt'
                  ? 'bg-primary/10 !text-primary hover:bg-primary/20'
                  : ''
              "
              (click)="pagination.setOrder('createdAt')"
            >
              <div class="flex items-center gap-2">
                Creado @if(pagination.sortBy() === 'createdAt') {
                <ng-icon
                  [name]="
                    pagination.sortOrder() === 'asc'
                      ? 'phosphorSortAscendingDuotone'
                      : 'phosphorSortDescendingDuotone'
                  "
                  class="text-xl"
                />}
              </div>
            </th>
            <th
              class="hover:bg-base-200 cursor-pointer"
              [class]="
                pagination.sortBy() === 'updatedAt'
                  ? 'bg-primary/10 !text-primary hover:bg-primary/20'
                  : ''
              "
              (click)="pagination.setOrder('updatedAt')"
            >
              <div class="flex items-center gap-2">
                Actualizado @if(pagination.sortBy() === 'updatedAt') {
                <ng-icon
                  [name]="
                    pagination.sortOrder() === 'asc'
                      ? 'phosphorSortAscendingDuotone'
                      : 'phosphorSortDescendingDuotone'
                  "
                  class="text-xl"
                />}
              </div>
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (subject of subjects.value() ?? []; track subject.id) {
          <tr>
            <td>{{ subject.name }}</td>
            <td>{{ subject.shortName }}</td>
            <td>{{ subject.code }}</td>
            <td>{{ subject.createdAt | date : 'short' }}</td>
            <td>{{ subject.updatedAt | date : 'short' }}</td>
            <td class="flex gap-2">
              <button
                class="btn btn-primary btn-xs btn-soft"
                (click)="editSubject(subject)"
              >
                <ng-icon name="phosphorPencilDuotone" /> Editar
              </button>
              <button
                class="btn btn-error btn-xs btn-soft"
                (click)="deleteSubject(subject)"
              >
                <ng-icon name="phosphorTrashDuotone" /> Eliminar
              </button>
            </td>
          </tr>
          }@empty { @if (subjects.isLoading()) {
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
          }@else {
          <tr>
            <td colspan="6" class="text-center">
              Sin valores para este filtro
            </td>
          </tr>
          } }
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
  #apollo = inject(Apollo);
  #confirmation = inject(Confirmation);
  #modal = inject(Modal);
  #toast = inject(Toast);
  pagination = inject(Pagination);
  searchText = signal('');

  public subjects = rxResource({
    params: () => ({
      take: this.pagination.take(),
      skip: this.pagination.skip(),
      search: this.pagination.search(),
      orderBy: this.pagination.sortBy(),
      orderDirection: this.pagination.sortOrder(),
    }),
    stream: ({ params }) => {
      const { take, skip, search, orderBy, orderDirection } = params;
      return this.#apollo
        .watchQuery<{
          count: number;
          subjects: Prisma.SubjectGetPayload<false>[];
        }>({
          query: gql`
            query GetSubjects(
              $take: Int!
              $skip: Int!
              $search: String
              $orderBy: String
              $orderDirection: String
            ) {
              count: findManySubjectsCount(search: $search)
              subjects(
                take: $take
                skip: $skip
                search: $search
                orderBy: $orderBy
                orderDirection: $orderDirection
              ) {
                id
                name
                shortName
                code
                createdAt
                updatedAt
              }
            }
          `,
          variables: {
            take,
            skip,
            search,
            orderBy,
            orderDirection,
          },
        })
        .valueChanges.pipe(
          tap(({ data }) => {
            this.pagination.updateCount(data.count);
          }),
          map((result) => result.data.subjects)
        );
    },
  });

  constructor() {
    afterRenderEffect(() => {
      this.pagination.updateSearch(this.searchText());
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
        switchMap(() =>
          this.#apollo.mutate({
            mutation: gql`
              mutation RemoveSubject($removeSubjectId: String!) {
                removeSubject(id: $removeSubjectId) {
                  id
                }
              }
            `,
            variables: {
              removeSubjectId: subject.id,
            },
          })
        )
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
