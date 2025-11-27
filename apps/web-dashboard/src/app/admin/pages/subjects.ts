import { Confirmation, Modal, Toast } from '@/ui';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorPencilDuotone,
  phosphorPlusCircleDuotone,
  phosphorTrashDuotone,
} from '@ng-icons/phosphor-icons/duotone';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { filter, map, of, switchMap } from 'rxjs';
import Store from '../../core/store';
import SubjectsForm from '../forms/subjects-form';

@Component({
  selector: 'app-subjects',
  imports: [DatePipe, NgIcon],
  viewProviders: [
    provideIcons({
      phosphorPencilDuotone,
      phosphorTrashDuotone,
      phosphorPlusCircleDuotone,
    }),
  ],
  template: `
    <div class="flex justify-end">
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
            <th>Nombre</th>
            <th>Nombre corto</th>
            <th>Código</th>
            <th>Fecha de creación</th>
            <th>Fecha de actualización</th>
            <th>Acciones</th>
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
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Subjects {
  private apollo = inject(Apollo);
  private store = inject(Store);
  private confirmation = inject(Confirmation);
  private modal = inject(Modal);
  private toast = inject(Toast);
  public subjects = rxResource({
    params: () => ({
      organizationId: this.store.currentOrganizationId(),
    }),
    stream: ({ params }) => {
      const { organizationId } = params;
      if (!organizationId) {
        return of([]);
      }
      return this.apollo
        .watchQuery<{ subjects: Prisma.SubjectGetPayload<false>[] }>({
          query: gql`
            query GetSubjects($organizationId: String!) {
              subjects(organizationId: $organizationId) {
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
            organizationId: params.organizationId,
          },
        })
        .valueChanges.pipe(map((result) => result.data.subjects));
    },
  });

  public editSubject(subject?: Prisma.SubjectGetPayload<false>) {
    this.modal
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
    this.confirmation
      .confirm({
        title: 'Eliminar Asignatura',
        message: `¿Estás seguro de eliminar la asignatura ${subject.name}?`,
      })
      .pipe(
        filter((confirmed: boolean) => confirmed === true),
        switchMap(() =>
          this.apollo.mutate({
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
          this.toast.showSuccess('Asignatura eliminada correctamente');
        },
        error: (error) => {
          console.error(error);
          this.toast.showError('Error al eliminar la asignatura');
        },
      });
  }
}
