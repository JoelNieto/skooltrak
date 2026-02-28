import { Loader } from '@/ui';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { map } from 'rxjs';
type TeacherType = Prisma.TeacherGetPayload<{
  include: { user: true; courses: true; classGroups: true; subjects: true };
}> & {
  name: string;
  fullName: string;
  initials: string;
  user: { id: string; email: string; color: string | null; emailVerified: boolean | null };
};

@Component({
  imports: [Loader, RouterLink, DatePipe],
  template: `@defer {
      @if (teacherResource.hasValue()) {
        @let teacher = teacherResource.value();
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
                <div class="text-white w-12 rounded-full" [style.background]="teacher.user?.color">
                  <span class="text-lg">{{ teacher.initials }}</span>
                </div>
              </div>
              <div class="flex flex-col">
                <div class="flex items-center gap-2">
                  {{ teacher.name }}
                  @if (teacher.user?.emailVerified) {
                    <span class="badge badge-success badge-sm gap-1">
                      <span class="material-symbols-outlined text-sm!">check_circle</span>
                      Verificado
                    </span>
                  } @else {
                    <span class="badge badge-warning badge-sm gap-1">
                      <span class="material-symbols-outlined text-sm!">schedule</span>
                      Pendiente
                    </span>
                  }
                </div>
                <span class="text-sm text-base-content/50">{{ teacher.user?.email }}</span>
              </div>
            </div>
            <div class="flex gap-2 items-center">
              <a class="btn btn-neutral" routerLink="edit">Editar</a>
              <button class="btn btn-neutral btn-soft">Mensaje</button>
            </div>
          </div>
        </div>
        <div class="tabs tabs-box mt-4">
          <input class="tab" type="radio" name="teacher_tabs" aria-label="Información Personal" checked="checked" />
          <div class="tab-content bg-base-100 border-base-300 p-4">
            <div>
              <div class="px-4 sm:px-0">
                <h3 class="text-base/7 font-semibold">Información Personal</h3>
                <p class="mt-1 max-w-2xl text-sm/6 text-base-content/60">Detalles personales y de contacto</p>
              </div>
              <div class="mt-6 border-t border-gray-100">
                <dl class="divide-y divide-gray-100">
                  <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt class="text-sm/6 font-medium text-base-content">Nombre completo</dt>
                    <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                      {{ teacher.fullName }}
                    </dd>
                  </div>
                  <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt class="text-sm/6 font-medium text-base-content">Documento de identidad</dt>
                    <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                      {{ teacher.documentId }}
                    </dd>
                  </div>
                  <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt class="text-sm/6 font-medium text-base-content">Fecha de nacimiento</dt>
                    <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                      {{ teacher.birthDate | date: 'dd/MM/yyyy' }}
                    </dd>
                  </div>
                  <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt class="text-sm/6 font-medium text-base-content">Género</dt>
                    <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                      {{ teacher.gender === 'MALE' ? 'Masculino' : 'Femenino' }}
                    </dd>
                  </div>
                  <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt class="text-sm/6 font-medium text-base-content">Dirección</dt>
                    <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                      {{ teacher.address || 'No especificada' }}
                    </dd>
                  </div>
                  <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt class="text-sm/6 font-medium text-base-content">Teléfono</dt>
                    <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                      {{ teacher.phoneNumber || 'No especificado' }}
                    </dd>
                  </div>
                  <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt class="text-sm/6 font-medium text-base-content">Correo personal</dt>
                    <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                      {{ teacher.personalEmail || 'No especificado' }}
                    </dd>
                  </div>
                  @if (teacher.about) {
                    <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                      <dt class="text-sm/6 font-medium text-base-content">Acerca de</dt>
                      <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                        {{ teacher.about }}
                      </dd>
                    </div>
                  }
                </dl>
              </div>
            </div>
          </div>

          <input class="tab" type="radio" name="teacher_tabs" aria-label="Información Académica" />
          <div class="tab-content bg-base-100 border-base-300 p-4">
            <div>
              <div class="px-4 sm:px-0">
                <h3 class="text-base/7 font-semibold">Información Académica</h3>
                <p class="mt-1 max-w-2xl text-sm/6 text-base-content/60">Materias, cursos y grupos asignados</p>
              </div>
              <div class="mt-6 border-t border-gray-100">
                <dl class="divide-y divide-gray-100">
                  <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt class="text-sm/6 font-medium text-base-content">Docente desde</dt>
                    <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                      {{ teacher.teacherSince || 'No especificado' }}
                    </dd>
                  </div>
                  <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt class="text-sm/6 font-medium text-base-content">Miembro desde</dt>
                    <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                      {{ teacher.memberSince ? (teacher.memberSince | date: 'dd/MM/yyyy') : 'No especificado' }}
                    </dd>
                  </div>
                  <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt class="text-sm/6 font-medium text-base-content">Materias</dt>
                    <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                      <div class="flex flex-wrap gap-2">
                        @for (subject of teacher.subjects; track subject.id) {
                          <span class="badge badge-secondary badge-soft">
                            {{ subject.name }}
                          </span>
                        } @empty {
                          <span class="text-sm/6 text-base-content/60"> No hay materias asignadas </span>
                        }
                      </div>
                    </dd>
                  </div>
                  <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt class="text-sm/6 font-medium text-base-content">Cursos</dt>
                    <dd class="mt-1 text-sm/6 text-base-content/90 sm:col-span-2 sm:mt-0">
                      <div class="flex flex-wrap gap-2">
                        @for (course of teacher.courses; track course.id) {
                          <a [routerLink]="['/courses', course.id]" class="badge badge-primary badge-soft">
                            {{ course.name }}
                          </a>
                        } @empty {
                          <span class="text-sm/6 text-base-content/60"> No hay cursos asignados </span>
                        }
                      </div>
                    </dd>
                  </div>
                  <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt class="text-sm/6 font-medium text-base-content">Grupos</dt>
                    <dd class="mt-2 text-sm text-base-content/90 sm:col-span-2 sm:mt-0">
                      <div class="flex flex-wrap gap-2">
                        @for (group of teacher.classGroups; track group.id) {
                          <a [routerLink]="['/groups', group.id]" class="badge badge-neutral badge-soft">
                            {{ group.name }}
                          </a>
                        } @empty {
                          <span class="text-sm/6 text-base-content/60"> No hay grupos asignados </span>
                        }
                      </div>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      }
    } @placeholder (minimum 1s) {
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
          fetchPolicy: 'cache-and-network',
          query: gql`
            query Teacher($teacherId: String!) {
              teacher(id: $teacherId) {
                id
                firstName
                middleName
                fatherName
                motherName
                name
                fullName
                initials
                documentId
                birthDate
                gender
                address
                phoneNumber
                personalEmail
                about
                teacherSince
                memberSince
                user {
                  id
                  email
                  color
                  emailVerified
                }
                subjects {
                  id
                  name
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
        .valueChanges.pipe(map((result) => result.data?.teacher));
    },
  });
}
