import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Pipe,
  PipeTransform,
  computed,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';

import { Apollo, gql } from 'apollo-angular';
import { addDays, endOfWeek, startOfWeek, subDays } from 'date-fns';
import { map, of } from 'rxjs';
import Store from '../core/store';
@Pipe({ name: 'stripHtml', standalone: true })
export class StripHtmlPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    return value
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

@Component({
  selector: 'app-assignments',
  imports: [RouterLink, DatePipe, StripHtmlPipe],

  template: `<div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Asignaciones</li>
      </ul>
    </div>
    <h1 class="text-2xl font-semibold mb-2">Asignaciones</h1>
    <div class="flex items-center gap-2 justify-between px-8">
      <div class="flex items-center gap-2 flex-1">
        <button
          class="btn btn-primary btn-soft btn-circle"
          (click)="previousWeek()"
        >
          <span class="material-symbols-outlined">chevron_left</span>
        </button>

        <button
          class="btn btn-primary btn-soft btn-circle"
          (click)="nextWeek()"
        >
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
      <div class="flex-1 text-center text-neutral-800 dark:text-neutral-200">
        {{ startDate() | date }} - {{ endDate() | date }}
      </div>
      <div class="flex-1 flex justify-end">
        <button class="btn btn-neutral btn-soft" (click)="today()">
          <span class="material-symbols-outlined">today</span> Hoy
        </button>
      </div>
    </div>
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow-sm mt-4">
      <table class="table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Detalles</th>
            <th>Fecha</th>
            <th>Curso</th>
            <th>Profesor</th>
            <th>Fecha de creación</th>
            <th>Fecha de actualización</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for( assignment of assignmentsResource.value(); track assignment.id)
          {
          <tr>
            <td>
              <a [routerLink]="assignment.id" class="link link-primary">{{
                assignment.title
              }}</a>
            </td>
            <td class="max-w-[24rem] truncate">
              {{ assignment.details | stripHtml }}
            </td>
            <td>{{ assignment.date | date : 'medium' }}</td>
            <td>{{ assignment.course.name }}</td>
            <td>
              {{ assignment.teacher.firstName }}
              {{ assignment.teacher.fatherName }}
            </td>
            <td>{{ assignment.createdAt | date : 'short' }}</td>
            <td>{{ assignment.updatedAt | date : 'short' }}</td>
            <td></td>
          </tr>
          } @empty {
          <tr>
            <td colspan="8" class="text-center">
              No hay asignaciones para esta semana
            </td>
          </tr>
          }
        </tbody>
      </table>
    </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Assignments {
  private store = inject(Store);
  private apollo = inject(Apollo);
  public currentDate = signal(new Date());
  public startDate = computed(() =>
    startOfWeek(this.currentDate(), { weekStartsOn: 1 })
  );
  public endDate = computed(() =>
    endOfWeek(this.currentDate(), { weekStartsOn: 1 })
  );

  public nextWeek() {
    this.currentDate.set(addDays(this.currentDate(), 7));
  }

  public previousWeek() {
    this.currentDate.set(subDays(this.currentDate(), 7));
  }

  public today() {
    this.currentDate.set(new Date());
  }

  public assignmentsResource = rxResource({
    params: () => ({
      startDate: this.startDate(),
      endDate: this.endDate(),
      schoolId: this.store.currentSchoolId(),
    }),
    stream: ({ params }) => {
      const { startDate, endDate, schoolId } = params;
      if (!schoolId) {
        return of([]);
      }
      return this.apollo
        .watchQuery<{
          assignmentsBySchoolId: Prisma.AssignmentGetPayload<{
            include: {
              course: true;
              teacher: true;
            };
          }>[];
        }>({
          query: gql`
            query AssignmentsBySchoolId(
              $schoolId: String!
              $startDate: String!
              $endDate: String!
            ) {
              assignmentsBySchoolId(
                schoolId: $schoolId
                startDate: $startDate
                endDate: $endDate
              ) {
                id
                title
                details
                course {
                  id
                  name
                }
                teacher {
                  id
                  firstName
                  fatherName
                }
                date
                createdAt
                updatedAt
              }
            }
          `,
          variables: {
            schoolId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        })
        .valueChanges.pipe(map((res) => res.data.assignmentsBySchoolId));
    },
  });
}
