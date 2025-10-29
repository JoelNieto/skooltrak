import { Modal } from '@/ui';
import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorPlusCircleDuotone } from '@ng-icons/phosphor-icons/duotone';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { map, of } from 'rxjs';
import Store from '../../core/store';
import TeachersForm from '../forms/teachers-form';

type Teacher = Prisma.TeacherGetPayload<false> & {
  name: string;
  fullName: string;
};

@Component({
  selector: 'app-teachers',
  imports: [NgIcon, DatePipe],
  viewProviders: [
    provideIcons({
      phosphorPlusCircleDuotone,
    }),
  ],
  template: ` <div class="flex justify-end">
      <button class="btn btn-primary" (click)="editTeacher()">
        <ng-icon name="phosphorPlusCircleDuotone" /> Agregar Profesor
      </button>
    </div>
    <div class="layout-padding">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Documento</th>
            <th>Fecha de nacimiento</th>
            <th>Genero</th>
            <th>Fecha de creación</th>
            <th>Fecha de actualización</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (teacher of teachers.value(); track teacher.id) {
          <tr>
            <td>{{ teacher.name }}</td>
            <td>{{ teacher.documentId }}</td>
            <td>{{ teacher.birthDate | date : 'shortDate' }}</td>
            <td>{{ teacher.gender }}</td>
            <td>{{ teacher.createdAt | date : 'short' }}</td>
            <td>{{ teacher.updatedAt | date : 'short' }}</td>
            <td>
              <button
                class="btn btn-primary btn-xs btn-soft"
                (click)="editTeacher(teacher)"
              >
                Editar
              </button>
            </td>
          </tr>
          }
        </tbody>
      </table>
    </div>`,
})
export default class Teachers {
  public store = inject(Store);
  private apollo = inject(Apollo);
  public modal = inject(Modal);
  public teachers = rxResource({
    params: () => ({
      organizationId: this.store.currentOrganizationId(),
    }),
    stream: ({ params }) => {
      const { organizationId } = params;
      if (!organizationId) {
        return of([]);
      }
      return this.apollo
        .watchQuery<{
          teachersByOrganizationId: Teacher[];
        }>({
          query: gql`
            query TeachersByOrganizationId($organizationId: String!) {
              teachersByOrganizationId(organizationId: $organizationId) {
                id
                firstName
                fatherName
                name
                documentId
                birthDate
                gender
                user {
                  id
                  email
                }
                createdAt
                updatedAt
              }
            }
          `,
          variables: {
            organizationId: params.organizationId,
          },
        })
        .valueChanges.pipe(
          map((result) => result.data.teachersByOrganizationId)
        );
    },
  });

  public editTeacher(teacher?: Prisma.TeacherGetPayload<false>) {
    this.modal
      .open(TeachersForm, {
        title: teacher ? 'Editar Profesor' : 'Agregar Profesor',
        data: {
          teacher,
        },
      })
      .closed.subscribe((result) => {
        if (result) {
          this.teachers.reload();
        }
      });
  }
}
