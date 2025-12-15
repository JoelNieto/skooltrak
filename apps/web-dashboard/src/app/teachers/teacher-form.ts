import { Loader, MultiSelect } from '@/ui';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { map } from 'rxjs';
type TeacherType = Prisma.TeacherGetPayload<{
  include: { courses: true; subjects: true };
}> & {
  name: string;
};

@Component({
  imports: [ReactiveFormsModule, RouterLink, Loader, MultiSelect],
  template: `@defer{@if(teacherResource.hasValue()){ @let teacher =
    teacherResource.value();
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li><a routerLink="/teachers">Docentes</a></li>
        <li>
          <a [routerLink]="['/teachers', teacher.id]">{{ teacher.name }}</a>
        </li>
        <li>Editar</li>
      </ul>
    </div>
    <h1 class="text-2xl font-semibold mb-4">{{ teacher.name }}</h1>
    <form>
      <div class="flex flex-col gap-6 divide-y divide-neutral-200">
        <div class="sm:grid sm:grid-cols-4 sm:gap-2 sm:px-0 pb-8">
          <div class="mb-4">
            <h2 class="text-lg/7 font-semibold text-base-content">
              Datos Personales
            </h2>
            <p class="mt-1 text-base text-base-content/70 dark:text-white/70">
              Información personal del docente.
            </p>
          </div>
          <div class="sm:col-span-3">
            <div class="card card-border border-base-300 bg-base-100">
              <div class="card-body gap-y-6">
                <div class="sm:grid sm:grid-cols-6 sm:gap-4">
                  <div class="fieldset col-span-3">
                    <label for="firstName">Nombre</label>
                    <input
                      id="firstName"
                      type="text"
                      class="input input-primary w-full"
                    />
                  </div>
                  <div class="fieldset col-span-3">
                    <label for="middleName"
                      >Segundo nombre
                      <span class="text-base-content/50 text-xs"
                        >(opcional)</span
                      ></label
                    >
                    <input
                      id="middleName"
                      type="text"
                      class="input input-primary w-full"
                    />
                  </div>
                  <div class="fieldset col-span-3">
                    <label for="lastName">Apellido</label>
                    <input
                      id="lastName"
                      type="text"
                      class="input input-primary w-full"
                    />
                  </div>
                  <div class="fieldset col-span-3">
                    <label for="motherName"
                      >Apellido materno/casada
                      <span class="text-base-content/50 text-xs"
                        >(opcional)</span
                      ></label
                    >
                    <input
                      id="motherName"
                      type="text"
                      class="input input-primary w-full"
                    />
                  </div>
                  <div class="fieldset col-span-2">
                    <label for="documentId">Nro. documento</label>
                    <input
                      id="documentId"
                      type="text"
                      class="input input-primary w-full"
                    />
                  </div>
                  <div class="fieldset col-span-2">
                    <label for="birthDate">Fecha de nacimiento</label>
                    <lib-multiselect />
                  </div>
                  <div class="fieldset col-span-2">
                    <label for="gender">Género</label>
                    <select id="gender" class="select select-primary w-full">
                      <option value="MALE">Masculino</option>
                      <option value="FEMALE">Femenino</option>
                    </select>
                  </div>
                  <div class="fieldset">
                    <label for="personalEmail">Email personal</label>
                    <input
                      type="email"
                      id="personalEmail"
                      class="input input-primary"
                    />
                  </div>
                  <div class="fieldset">
                    <label for="phoneNumber">Nro. Telefono</label>
                    <input
                      type="text"
                      id="phoneNumber"
                      class="input input-primary"
                    />
                  </div>
                  <div class="fieldset col-span-3">
                    <label for="address">Direccion</label>
                    <input
                      type="text"
                      id="address"
                      class="input input-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="sm:grid sm:grid-cols-4 sm:gap-2 sm:px-0 pb-8">
          <div class="mb-4">
            <h2 class="text-lg/7 font-semibold text-base-content">
              Datos laborales
            </h2>
            <p class="mt-1 text-base text-base-content/70 dark:text-white/70">
              Información laboral del docente.
            </p>
          </div>
          <div class="sm:col-span-3">
            <div class="card card-border border-base-300 bg-base-100">
              <div class="card-body gap-y-6">
                <div class="sm:grid sm:grid-cols-6 sm:gap-4">
                  <div class="fieldset col-span-2">
                    <label for="email">Email personal</label>
                    <input
                      id="email"
                      type="email"
                      class="input input-primary w-full"
                    />
                  </div>
                  <div class="fieldset col-span-2">
                    <label for="middleName"
                      >Telefono
                      <span class="text-base-content/50 text-xs"
                        >(opcional)</span
                      ></label
                    >
                    <input
                      id="middleName"
                      type="text"
                      class="input input-primary w-full"
                    />
                  </div>
                  <div class="fieldset col-span-2">
                    <label for="lastName">Apellido</label>
                    <input
                      id="lastName"
                      type="text"
                      class="input input-primary w-full"
                    />
                  </div>
                  <div class="fieldset col-span-2">
                    <label for="motherName"
                      >Apellido materno/casada
                      <span class="text-base-content/50 text-xs"
                        >(opcional)</span
                      ></label
                    >
                    <input
                      id="motherName"
                      type="text"
                      class="input input-primary w-full"
                    />
                  </div>
                </div>

                <div class="sm:grid sm:grid-cols-6 sm:gap-4">
                  <div class="fieldset col-span-2">
                    <label for="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      class="input input-primary w-full"
                    />
                  </div>
                  <div class="fieldset col-span-2">
                    <label for="birthDate">Fecha de nacimiento</label>
                    <input
                      id="birthDate"
                      type="date"
                      class="input input-primary w-full"
                    />
                  </div>
                  <div class="fieldset col-span-2">
                    <label for="gender">Género</label>
                    <lib-multiselect />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
    }}@placeholder ( minimum 1s){
    <lib-loader />
    } @loading (after 100ms; minimum 1s) {
    <lib-loader />
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TeacherForm {
  public id = input.required<string>();
  #apollo = inject(Apollo);

  fruitOptions = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'orange', label: 'Orange' },
    { value: 'grape', label: 'Grape' },
    { value: 'strawberry', label: 'Strawberry' },
    { value: 'mango', label: 'Mango' },
    { value: 'pineapple', label: 'Pineapple' },
  ];
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
                courses {
                  id
                  name
                }
                subjects {
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
