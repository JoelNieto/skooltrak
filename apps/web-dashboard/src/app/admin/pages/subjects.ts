import { Confirmation, Modal, Paginator, Toast } from '@/ui';
import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorMagnifyingGlassDuotone,
  phosphorPencilDuotone,
  phosphorPlusCircleDuotone,
  phosphorSortAscendingDuotone,
  phosphorSortDescendingDuotone,
  phosphorTrashDuotone,
} from '@ng-icons/phosphor-icons/duotone';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { filter, map, switchMap, tap } from 'rxjs';
import SubjectsForm from '../forms/subjects-form';

@Component({
  selector: 'app-subjects',
  imports: [DatePipe, NgIcon, Paginator],
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
          <input class="pl-0" type="search" placeholder="Buscar..." />
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
            <th class="hover:bg-base-200 cursor-pointer">
              <div class="flex items-center gap-2">
                Nombre
                <ng-icon name="phosphorSortAscendingDuotone" class="text-xl" />
              </div>
            </th>
            <th class="hover:bg-base-200 cursor-pointer">Nombre corto</th>
            <th class="hover:bg-base-200 cursor-pointer">Código</th>
            <th class="hover:bg-base-200 cursor-pointer">Fecha de creación</th>
            <th class="hover:bg-base-200 cursor-pointer">
              Fecha de actualización
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
              <button class="btn btn-error btn-xs btn-soft">
                <ng-icon name="phosphorTrashDuotone" /> Eliminar
              </button>
            </td>
          </tr>
          }
        </tbody>
      </table>
      <div class="p-4 rounded-b-lg ">
        <lib-paginator
          [count]="pagination().count"
          [take]="pagination().take"
          [skip]="pagination().skip"
          (skipChange)="updateSkip($event)"
          (takeChange)="updateTake($event)"
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

  public updateSkip(skip: number) {
    this.pagination.update((prev) => ({ ...prev, skip }));
  }

  public updateTake(take: number) {
    this.pagination.update((prev) => ({ ...prev, take }));
  }
  public take = computed(() => this.pagination().take);
  public skip = computed(() => this.pagination().skip);

  public pagination = signal({
    take: 10,
    skip: 0,
    count: 0,
  });
  public subjects = rxResource({
    params: () => ({
      take: this.take(),
      skip: this.skip(),
    }),
    stream: ({ params }) => {
      const { take, skip } = params;
      return this.#apollo
        .watchQuery<{
          count: number;
          subjects: Prisma.SubjectGetPayload<false>[];
        }>({
          query: gql`
            query GetSubjects($take: Int!, $skip: Int!) {
              count: findManySubjectsCount
              subjects(take: $take, skip: $skip) {
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
          },
        })
        .valueChanges.pipe(
          tap((result) => {
            this.pagination.update((prev) => ({
              ...prev,
              count: result.data.count,
            }));
          }),
          map((result) => result.data.subjects)
        );
    },
  });

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
