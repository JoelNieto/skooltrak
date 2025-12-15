import { Loader } from '@/ui';
import { DatePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { map } from 'rxjs';
type StudentType = Prisma.StudentGetPayload<{
  include: { classGroup: true; courses: true };
}> & {
  name: string;
  email: string;
  color: string;
  initials: string;
  fullName: string;
};

@Component({
  selector: 'app-student',
  imports: [RouterLink, Loader, DatePipe],
  template: `
    @if (studentResource.isLoading()) {
    <lib-loader />
    } @else { @if(studentResource.hasValue()) { @let student =
    studentResource.value();
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li><a routerLink="/students">Alumnos</a></li>

        <li>{{ student.name }}</li>
      </ul>
    </div>
    <div class="card w-full bg-base-100 mt-4">
      <div class="card-body">
        <div class="flex items-center justify-between">
          <div class="flex gap-2 items-center">
            <div class="avatar avatar-placeholder">
              <div
                class="rounded-full h-12 text-white"
                [style.background]="student.color"
              >
                <span class="text-lg">{{ student.initials }}</span>
              </div>
            </div>
            <div class="flex flex-col">
              {{ student.name }}

              <span class="text-sm text-base-content/60">{{
                student.classGroup.name
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="tabs tabs-box mt-4">
      <input
        class="tab"
        type="radio"
        name="messages_tabs"
        aria-label="Informacion"
        checked="checked"
      />

      <div class="tab-content bg-base-100 border-base-300 p-4">
        <div>
          <div class="px-4 sm:px-0">
            <h3 class="text-base/7 font-semibold">Informacion</h3>
            <p class="mt-1 max-w-2xl text-sm/6 text-base-content/60">
              Detalles personales y de contacto
            </p>
          </div>
          <div class="mt-6 border-t border-gray-100">
            <dl class="divide-y divide-gray-100">
              <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt class="text-sm/6 font-medium text-base-content">
                  Nombre completo
                </dt>
                <dd
                  class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0"
                >
                  {{ student.fullName }}
                </dd>
              </div>
              <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt class="text-sm/6 font-medium text-base-content">
                  Documento de identidad
                </dt>
                <dd
                  class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0"
                >
                  {{ student.documentId }}
                </dd>
              </div>
              <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt class="text-sm/6 font-medium text-base-content">Grupo</dt>
                <dd
                  class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0"
                >
                  {{ student.classGroup.name }}
                </dd>
              </div>
              <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt class="text-sm/6 font-medium text-base-content">
                  Fecha de nacimiento
                </dt>
                <dd
                  class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0"
                >
                  {{ student.birthDate | date : 'dd/MM/yyyy' }}
                </dd>
              </div>
              <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt class="text-sm/6 font-medium text-base-content">
                  Dirección
                </dt>
                <dd
                  class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0"
                >
                  {{ student.address }}
                </dd>
              </div>
              <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt class="text-sm/6 font-medium text-base-content">
                  Teléfono
                </dt>
                <dd
                  class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0"
                >
                  {{ student.phone }}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
    } }
  `,
})
export default class Student {
  public id = input.required<string>();
  private apollo = inject(Apollo);
  public studentResource = rxResource({
    params: () => ({
      id: this.id(),
    }),
    stream: ({ params }) =>
      this.apollo
        .watchQuery<{
          student: StudentType;
        }>({
          query: gql`
            query Student($id: String!) {
              student(id: $id) {
                id
                firstName
                fatherName
                fullName
                name
                classGroup {
                  name
                }
                courses {
                  name
                }
                color
                email
                documentId
                birthDate
                initials
                gender
                address
                phone
                createdAt
                updatedAt
              }
            }
          `,
          variables: {
            id: params.id,
          },
        })
        .valueChanges.pipe(map((result) => result.data.student)),
  });
}
