import {
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Icon,
  UiTable,
  UiTableEmpty,
  UiTableError,
  UiTableSkeleton,
  listState,
} from '#/ui';
import { DatePipe } from '@angular/common';
import { Component, Pipe, PipeTransform, computed, inject, signal } from '@angular/core';
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
  imports: [
    Breadcrumbs,
    Card,
    UiTable,
    UiTableEmpty,
    UiTableError,
    UiTableSkeleton,
    Badge,
    Button,
    RouterLink,
    DatePipe,
    StripHtmlPipe,
    Icon,
  ],

  template: `<ui-breadcrumbs [items]="[{ label: 'Inicio', link: '/' }, { label: 'Asignaciones' }]" />
    <h1 class="text-2xl font-semibold mb-2">Asignaciones</h1>
    <div class="flex items-center gap-2 justify-between px-8">
      <div class="flex items-center gap-2 flex-1">
        <button uiButton iconOnly aria-label="Semana anterior" (click)="previousWeek()">
          <ui-icon name="chevron-left" />
        </button>

        <button uiButton iconOnly aria-label="Semana siguiente" (click)="nextWeek()">
          <ui-icon name="chevron-right" />
        </button>
      </div>
      <div class="flex-1 text-center text-ink-strong">{{ startDate() | date }} - {{ endDate() | date }}</div>
      <div class="flex-1 flex justify-end">
        <button uiButton (click)="today()"><ui-icon name="calendar-check" /> Hoy</button>
      </div>
    </div>
    <div uiCard class="overflow-x-auto mt-4">
      <table uiTable [attr.aria-busy]="assignmentDatesResource.isLoading()">
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
          </tr>
        </thead>
        @switch (assignmentsList.phase()) {
          @case ('skeleton') {
            <tbody uiTableSkeleton [columns]="columns()"></tbody>
          }
          @case ('error') {
            <tbody>
              <tr uiTableError [columns]="columns()" (retry)="assignmentDatesResource.reload()"></tr>
            </tbody>
          }
          @case ('ready') {
            <tbody>
              @for (item of assignmentsList.rows() ?? []; track item.id) {
                <tr>
                  <td>
                    <a [routerLink]="['/assignments', item.assignment.id]" class="link link-primary">{{
                      item.assignment.title
                    }}</a>
                  </td>
                  <td class="max-w-[24rem] truncate">
                    {{ item.assignment.details | stripHtml }}
                  </td>
                  <td>{{ item.date | date: 'medium' }}</td>
                  @if (!isStudent()) {
                    <td>
                      <span uiBadge>{{ item.classGroup.name }}</span>
                    </td>
                  }
                  <td>{{ item.assignment.course.name }}</td>
                  <td>
                    {{ item.assignment.teacher.firstName }}
                    {{ item.assignment.teacher.fatherName }}
                  </td>
                </tr>
              } @empty {
                <tr
                  uiTableEmpty
                  [columns]="columns()"
                  icon="calendar-x"
                  title="No hay asignaciones esta semana"
                  description="Usa las flechas para ver otras semanas."
                ></tr>
              }
            </tbody>
          }
        }
      </table>
    </div>`,
})
export default class Assignments {
  private store = inject(Store);
  private http = inject(HttpClient);
  private auth = inject(Auth);

  public isStudent = this.auth.isStudent;
  /** Students don't see the group column. */
  protected readonly columns = computed(() => (this.isStudent() ? 5 : 6));
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
  /** assignments with smooth loading: this week's rows stay while the next week loads. */
  protected readonly assignmentsList = listState(this.assignmentDatesResource);
}
