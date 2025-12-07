import { Loader } from '@/ui';
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
  include: { user: true; courses: true };
}> & {
  name: string;
  fullName: string;
  initials: string;
};

@Component({
  imports: [Loader, RouterLink],
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
                  Application for
                </dt>
                <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                  Backend Developer
                </dd>
              </div>
              <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt class="text-sm/6 font-medium text-gray-900">
                  Email address
                </dt>
                <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                  margotfoster@example.com
                </dd>
              </div>
              <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt class="text-sm/6 font-medium text-gray-900">
                  Salary expectation
                </dt>
                <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                  $120,000
                </dd>
              </div>
              <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt class="text-sm/6 font-medium text-gray-900">About</dt>
                <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                  Fugiat ipsum ipsum deserunt culpa aute sint do nostrud anim
                  incididunt cillum culpa consequat. Excepteur qui ipsum aliquip
                  consequat sint. Sit id mollit nulla mollit nostrud in ea
                  officia proident. Irure nostrud pariatur mollit ad adipisicing
                  reprehenderit deserunt qui eu.
                </dd>
              </div>
              <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt class="text-sm/6 font-medium text-gray-900">Attachments</dt>
                <dd class="mt-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <ul
                    role="list"
                    class="divide-y divide-gray-100 rounded-md border border-gray-200"
                  >
                    <li
                      class="flex items-center justify-between py-4 pr-5 pl-4 text-sm/6"
                    >
                      <div class="flex w-0 flex-1 items-center">
                        <svg
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          data-slot="icon"
                          aria-hidden="true"
                          class="size-5 shrink-0 text-gray-400"
                        >
                          <path
                            d="M15.621 4.379a3 3 0 0 0-4.242 0l-7 7a3 3 0 0 0 4.241 4.243h.001l.497-.5a.75.75 0 0 1 1.064 1.057l-.498.501-.002.002a4.5 4.5 0 0 1-6.364-6.364l7-7a4.5 4.5 0 0 1 6.368 6.36l-3.455 3.553A2.625 2.625 0 1 1 9.52 9.52l3.45-3.451a.75.75 0 1 1 1.061 1.06l-3.45 3.451a1.125 1.125 0 0 0 1.587 1.595l3.454-3.553a3 3 0 0 0 0-4.242Z"
                            clip-rule="evenodd"
                            fill-rule="evenodd"
                          />
                        </svg>
                        <div class="ml-4 flex min-w-0 flex-1 gap-2">
                          <span class="truncate font-medium text-gray-900"
                            >resume_back_end_developer.pdf</span
                          >
                          <span class="shrink-0 text-gray-400">2.4mb</span>
                        </div>
                      </div>
                      <div class="ml-4 shrink-0">
                        <a
                          href="#"
                          class="font-medium text-indigo-600 hover:text-indigo-500"
                          >Download</a
                        >
                      </div>
                    </li>
                    <li
                      class="flex items-center justify-between py-4 pr-5 pl-4 text-sm/6"
                    >
                      <div class="flex w-0 flex-1 items-center">
                        <svg
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          data-slot="icon"
                          aria-hidden="true"
                          class="size-5 shrink-0 text-gray-400"
                        >
                          <path
                            d="M15.621 4.379a3 3 0 0 0-4.242 0l-7 7a3 3 0 0 0 4.241 4.243h.001l.497-.5a.75.75 0 0 1 1.064 1.057l-.498.501-.002.002a4.5 4.5 0 0 1-6.364-6.364l7-7a4.5 4.5 0 0 1 6.368 6.36l-3.455 3.553A2.625 2.625 0 1 1 9.52 9.52l3.45-3.451a.75.75 0 1 1 1.061 1.06l-3.45 3.451a1.125 1.125 0 0 0 1.587 1.595l3.454-3.553a3 3 0 0 0 0-4.242Z"
                            clip-rule="evenodd"
                            fill-rule="evenodd"
                          />
                        </svg>
                        <div class="ml-4 flex min-w-0 flex-1 gap-2">
                          <span class="truncate font-medium text-gray-900"
                            >coverletter_back_end_developer.pdf</span
                          >
                          <span class="shrink-0 text-gray-400">4.5mb</span>
                        </div>
                      </div>
                      <div class="ml-4 shrink-0">
                        <a
                          href="#"
                          class="font-medium text-indigo-600 hover:text-indigo-500"
                          >Download</a
                        >
                      </div>
                    </li>
                  </ul>
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
