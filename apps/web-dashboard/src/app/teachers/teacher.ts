import { Loader } from '@/ui';
import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { map } from 'rxjs';
type TeacherType = Prisma.TeacherGetPayload<{
  include: { user: true; courses: true; classGroups: true };
}> & {
  name: string;
  fullName: string;
  initials: string;
};

@Component({
  imports: [Loader, RouterLink, DatePipe],
  template: `@defer { @if(teacherResource.hasValue()) { @let teacher =
    teacherResource.value();
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li><a routerLink="/teachers">Docentes</a></li>
        <li>{{ teacher.name }}</li>
      </ul>
    </div>
    <div class="card card-border border-base-200 bg-base-100 mt-4">
      <div class="card-body flex flex-row justify-between items-center">
        <div class="flex gap-2 items-center ">
          <div class="avatar avatar-placeholder">
            <div
              class="text-white w-12 rounded-full"
              [style.background]="teacher.user.color"
            >
              <span class="text-lg">{{ teacher.initials }}</span>
            </div>
          </div>
          <div class="flex flex-col">
            {{ teacher.name }}
            <span class="text-sm text-base-content/50">{{
              teacher.user.email
            }}</span>
          </div>
        </div>
        <div class="flex gap-2 items-center">
          <a class="btn btn-neutral" routerLink="edit">Editar</a>
          <button class="btn btn-neutral btn-soft">Mensaje</button>
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
                  {{ teacher.fullName }}
                </dd>
              </div>
              <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt class="text-sm/6 font-medium text-gray-900">
                  Documento de identidad
                </dt>
                <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {{ teacher.documentId }}
                </dd>
              </div>
              <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt class="text-sm/6 font-medium text-gray-900">
                  Fecha de nacimiento
                </dt>
                <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {{ teacher.birthDate | date : 'dd/MM/yyyy' }}
                </dd>
              </div>
              <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt class="text-sm/6 font-medium text-gray-900">Genero</dt>
                <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {{ teacher.gender === 'MALE' ? 'Masculino' : 'Femenino' }}
                </dd>
              </div>
              <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt class="text-sm/6 font-medium text-gray-900">Dirección</dt>
                <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {{ teacher.address }}
                </dd>
              </div>

              <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt class="text-sm/6 font-medium text-gray-900">Cursos</dt>
                <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                  <div class="flex flex-wrap gap-2">
                    @for (course of teacher.courses; track course.id) {
                    <a
                      [routerLink]="['/courses', course.id]"
                      class="badge badge-primary badge-soft"
                    >
                      {{ course.name }}
                    </a>
                    } @empty {
                    <span class="text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                      No hay cursos asignados
                    </span>
                    }
                  </div>
                </dd>
              </div>
              <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt class="text-sm/6 font-medium text-gray-900">Grupos</dt>
                <dd class="mt-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <div class="flex flex-wrap gap-2">
                    @for (group of teacher.classGroups; track group.id) {
                    <a
                      [routerLink]="['/groups', group.id]"
                      class="badge badge-neutral badge-soft"
                    >
                      {{ group.name }}
                    </a>
                    } @empty {
                    <span class="text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                      No hay grupos asignados
                    </span>
                    }
                  </div>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
    } } @placeholder ( minimum 1s){
    <lib-loader />
    } @loading (after 100ms; minimum 1s) {
    <lib-loader />
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Teacher {
  public id = input.required<string>();
  #apollo = inject(Apollo);
  public teacherResource = rxResource({
    params: () => ({
      id: this.id(),
    }),
    stream: ({ params }) => {
      const { id } = params;
      return this.#apollo
        .watchQuery<{ teacher: TeacherType }>({
          query: gql`
            query Teacher($teacherId: String!) {
              teacher(id: $teacherId) {
                id
                firstName
                fatherName
                name
                fullName
                initials
                documentId
                birthDate
                gender
                user {
                  id
                  email
                  color
                }
                courses {
                  id
                  name
                }
                classGroups {
                  id
                  name
                }
                createdAt
                updatedAt
              }
            }
          `,
          variables: {
            teacherId: id,
          },
        })
        .valueChanges.pipe(map((result) => result.data.teacher));
    },
  });
}
