import { Confirmation, Modal, Pagination, Paginator, Toast } from '@/ui';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { DatePipe } from '@angular/common';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorDotsThreeOutlineDuotone,
  phosphorEyeDuotone,
  phosphorMagnifyingGlassDuotone,
  phosphorPencilDuotone,
  phosphorPlusCircleDuotone,
  phosphorTrashDuotone,
} from '@ng-icons/phosphor-icons/duotone';
import { Apollo, gql } from 'apollo-angular';
import { filter, map, switchMap, tap } from 'rxjs';
import Store from '../../core/store';
import TeachersForm from '../forms/teachers-form';
type Teacher = Prisma.TeacherGetPayload<{ include: { user: true } }> & {
  name: string;
  initials: string;
};

@Component({
  selector: 'app-teachers',
  imports: [
    NgIcon,
    DatePipe,
    Paginator,
    FormsModule,
    RouterLink,
    Menu,
    MenuTrigger,
    OverlayModule,
    MenuContent,
    MenuItem,
  ],
  providers: [Pagination],
  viewProviders: [
    provideIcons({
      phosphorPlusCircleDuotone,
      phosphorMagnifyingGlassDuotone,
      phosphorEyeDuotone,
      phosphorPencilDuotone,
      phosphorTrashDuotone,
      phosphorDotsThreeOutlineDuotone,
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
      <button class="btn btn-primary" (click)="editTeacher()">
        <ng-icon name="phosphorPlusCircleDuotone" /> Agregar Profesor
      </button>
    </div>
    <div
      class="overflow-x-auto bg-base-100 rounded-lg mt-4 border border-base-300"
    >
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Documento</th>
            <th>Fecha de nacimiento</th>
            <th>Genero</th>
            <th>Creado</th>
            <th>Actualizado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (teacher of teachers.value(); track teacher.id) {
          <tr>
            <td>
              <div
                class="flex gap-2 items-center cursor-pointer"
                [routerLink]="['/teachers', teacher.id]"
              >
                <div class="avatar avatar-placeholder">
                  <div
                    class="text-white w-8 rounded-full"
                    [style.background]="teacher.user.color"
                  >
                    <span class="text-sm">{{ teacher.initials }}</span>
                  </div>
                </div>
                <div class="flex flex-col">
                  {{ teacher.name }}
                  <span class="text-sm text-base-content/50">{{
                    teacher.user.email
                  }}</span>
                </div>
              </div>
            </td>
            <td>{{ teacher.documentId }}</td>
            <td>{{ teacher.birthDate | date : 'shortDate' }}</td>
            <td>{{ teacher.gender }}</td>
            <td>{{ teacher.createdAt | date : 'short' }}</td>
            <td>{{ teacher.updatedAt | date : 'short' }}</td>
            <td>
              <button
                class="cursor-pointer hover:bg-base-200 p-1 rounded-lg flex items-center justify-center"
                ngMenuTrigger
                #origin
                #trigger="ngMenuTrigger"
                [menu]="actionsMenu()"
              >
                <ng-icon
                  name="phosphorDotsThreeOutlineDuotone"
                  class="text-xl"
                />
              </button>
              <ng-template
                [cdkConnectedOverlayOpen]="trigger.expanded()"
                [cdkConnectedOverlay]="{origin, usePopover: 'inline'}"
                [cdkConnectedOverlayPositions]="[
                  {
                    originX: 'end',
                    originY: 'bottom',
                    overlayX: 'end',
                    overlayY: 'top',
                    offsetY: 4
                  }
                ]"
                cdkAttachPopoverAsChild
              >
                <div
                  ngMenu
                  class="bg-base-100 shadow-sm rounded-lg p-1 w-48"
                  #actionsMenu="ngMenu"
                >
                  <ng-template ngMenuContent>
                    <a
                      ngMenuItem
                      value="view"
                      [routerLink]="['/teachers', teacher.id]"
                      class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                    >
                      <ng-icon name="phosphorEyeDuotone" class="text-lg" />
                      <span>Ver</span>
                    </a>
                    <button
                      ngMenuItem
                      value="edit"
                      class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                      (click)="editTeacher(teacher)"
                    >
                      <ng-icon name="phosphorPencilDuotone" class="text-lg" />
                      <span>Editar</span>
                    </button>
                    <button
                      ngMenuItem
                      value="delete"
                      class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-base-200 w-full"
                      (click)="deleteTeacher(teacher)"
                    >
                      <ng-icon name="phosphorTrashDuotone" class="text-lg" />
                      <span>Eliminar</span>
                    </button>
                  </ng-template>
                </div>
              </ng-template>
            </td>
          </tr>
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
export default class Teachers {
  public store = inject(Store);
  private apollo = inject(Apollo);
  public modal = inject(Modal);
  public pagination = inject(Pagination);
  #confirmation = inject(Confirmation);
  #toasts = inject(Toast);
  actionsMenu = viewChild<Menu<string>>('actionsMenu');
  searchText = signal('');

  public teachers = rxResource({
    params: () => ({
      take: this.pagination.take(),
      skip: this.pagination.skip(),
      search: this.pagination.search(),
      orderBy: this.pagination.sortBy(),
      orderDirection: this.pagination.sortOrder(),
    }),
    stream: ({ params }) => {
      const { take, skip, search, orderBy, orderDirection } = params;

      return this.apollo
        .watchQuery<{
          count: number;
          teachers: Teacher[];
        }>({
          query: gql`
            query getTeachers(
              $take: Int!
              $skip: Int!
              $search: String
              $orderBy: String
              $orderDirection: String
            ) {
              count: findManyTeachersCount(search: $search)
              teachers(
                take: $take
                skip: $skip
                search: $search
                orderBy: $orderBy
                orderDirection: $orderDirection
              ) {
                id
                firstName
                fatherName
                name
                initials
                documentId
                birthDate
                gender
                user {
                  id
                  email
                  color
                  initials
                }
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
          map((result) => result.data.teachers)
        );
    },
  });

  constructor() {
    afterRenderEffect(() => {
      this.pagination.updateSearch(this.searchText());
    });
  }

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

  public deleteTeacher(teacher: Teacher) {
    this.#confirmation
      .confirm({
        title: 'Eliminar Profesor',
        message: '¿Estás seguro de eliminar este profesor?',
      })
      .pipe(
        filter((result) => result),
        switchMap(() => {
          return this.apollo.mutate({
            mutation: gql`
              mutation DeleteTeacher($id: String!) {
                deleteTeacher(id: $id) {
                  id
                }
              }
            `,
            variables: {
              id: teacher.id,
            },
          });
        })
      )
      .subscribe(() => {
        this.#toasts.showSuccess('Profesor eliminado correctamente');
        this.teachers.reload();
      });
  }
}
