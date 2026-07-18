import { Error, Loader } from '#/ui';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Pipe, PipeTransform, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { HttpClient, HttpParams } from '@angular/common/http';
import { addDays, endOfWeek, startOfWeek, subDays } from 'date-fns';
import { map, of } from 'rxjs';
import Auth from '../auth/auth';
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
  imports: [RouterLink, DatePipe, StripHtmlPipe, Error, Loader],

  template: `<div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Asignaciones</li>
      </ul>
    </div>
    <h1 class="text-2xl font-semibold mb-2">Asignaciones</h1>
    <div class="flex items-center gap-2 justify-between px-8">
      <div class="flex items-center gap-2 flex-1">
        <button class="btn btn-primary btn-soft btn-circle" (click)="previousWeek()">
          <span class="material-symbols-outlined">chevron_left</span>
        </button>

        <button class="btn btn-primary btn-soft btn-circle" (click)="nextWeek()">
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
      <div class="flex-1 text-center text-base-content">{{ startDate() | date }} - {{ endDate() | date }}</div>
      <div class="flex-1 flex justify-end">
        <button class="btn btn-soft" (click)="today()"><span class="material-symbols-outlined">today</span> Hoy</button>
      </div>
    </div>
    <div class="overflow-x-auto bg-base-100 rounded-lg mt-4">
      @if (assignmentDatesResource.hasValue()) {
        @let list = assignmentDatesResource.value()!;
        <table class="table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Detalles</th>
              <th>Fecha de entrega</th>
              @if (!isStudent()) {
                <th>Grupo</th>
              }
              <th>Curso</th>
              <th>Profesor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (item of list; track item.id) {
              <tr>
                <td>
                  <a [routerLink]="['/assignments', item.assignment.id]" class="link link-primary">{{ item.assignment.title }}</a>
                </td>
                <td class="max-w-[24rem] truncate">
                  {{ item.assignment.details | stripHtml }}
                </td>
                <td>{{ item.date | date: 'medium' }}</td>
                @if (!isStudent()) {
                  <td>
                    <span class="badge badge-outline">{{ item.classGroup.name }}</span>
                  </td>
                }
                <td>{{ item.assignment.course.name }}</td>
                <td>
                  {{ item.assignment.teacher.firstName }}
                  {{ item.assignment.teacher.fatherName }}
                </td>
                <td></td>
              </tr>
            } @empty {
              <tr>
                <td [attr.colspan]="isStudent() ? 6 : 7" class="text-center">No hay asignaciones para esta semana</td>
              </tr>
            }
          </tbody>
        </table>
      } @else if (assignmentDatesResource.error()) {
        <lib-error
          (retry)="assignmentDatesResource.reload()"
          [description]="$safeNavigationMigration(assignmentDatesResource.error()?.message)"
        />
      } @else {
        <lib-loader />
      }
    </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Assignments {
  private store = inject(Store);
  private http = inject(HttpClient);
  private auth = inject(Auth);

  public isStudent = this.auth.isStudent;
  public currentDate = signal(new Date());
  public startDate = computed(() => startOfWeek(this.currentDate(), { weekStartsOn: 1 }));
  public endDate = computed(() => endOfWeek(this.currentDate(), { weekStartsOn: 1 }));

  public nextWeek() {
    this.currentDate.set(addDays(this.currentDate(), 7));
  }

  public previousWeek() {
    this.currentDate.set(subDays(this.currentDate(), 7));
  }

  public today() {
    this.currentDate.set(new Date());
  }

  public assignmentDatesResource = rxResource({
    params: () => ({
      startDate: this.startDate(),
      endDate: this.endDate(),
      schoolId: this.store.currentSchoolId(),
      classGroupId: this.store.currentStudentGroupId(),
    }),
    stream: ({ params }) => {
      const { startDate, endDate, schoolId, classGroupId } = params;
      if (!schoolId) {
        return of([]);
      }
      let p = new HttpParams()
        .set('schoolId', schoolId)
        .set('startDate', startDate.toISOString())
        .set('endDate', endDate.toISOString());
      if (classGroupId) {
        p = p.set('classGroupId', classGroupId);
      }
      return this.http
        .get<
          Array<{
            id: string;
            date: string;
            classGroup: { name: string };
            assignment: {
              id: string;
              title: string;
              details: string;
              course: { name: string };
              teacher: { firstName: string; fatherName: string };
            };
          }>
        >(`/api/v1/assignments/dates/by-school`, { params: p })
        .pipe(
          map((rows) =>
            (rows ?? []).map((item) => ({
              ...item,
              date: new Date(item.date ?? ''),
            })),
          ),
        );
    },
  });
}
