import { Modal } from '@/ui';
import { DatePipe, JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Injector,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { map, of } from 'rxjs';
import Store from '../core/store';
import GradesForm from './grades-form';

@Component({
  selector: 'app-course-grades',
  imports: [FormsModule, DatePipe, RouterLink, JsonPipe],
  template: ` <div class="flex justify-end gap-2">
      <select
        class="select select-primary w-64!"
        [ngModel]="currentPeriod()"
        (ngModelChange)="periodId.set($event)"
      >
        <option disabled selected value="">Selecciona un periodo...</option>
        @for(period of periodsResource.value()!; track period.id) {
        <option [value]="period.id">{{ period.name }}</option>
        }
      </select>
      <button class="btn btn-primary btn-soft" (click)="editGrade()">
        Nueva calificacion
      </button>
    </div>
    <div class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Titulo</th>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Publicada</th>
            <th>Fecha de creacion</th>
            <th>Fecha de actualizacion</th>
          </tr>
        </thead>
        <tbody>
          @for(grade of gradesResource.value(); track grade.id) {
          <tr>
            <td>
              <a
                [routerLink]="['/grades', grade.id]"
                class="link link-primary"
                >{{ grade.title }}</a
              >
            </td>
            <td>{{ grade.date | date }}</td>
            <td>{{ grade.bucket.name }}</td>
            <td>{{ grade.published }}</td>
            <td>{{ grade.createdAt | date : 'short' }}</td>
            <td>{{ grade.updatedAt | date : 'short' }}</td>
          </tr>
          } @empty {
          <tr>
            <td colspan="6" class="text-center">
              No hay calificaciones para este curso
            </td>
          </tr>
          }
        </tbody>
      </table>
      {{ groupedGrades() | json }}
    </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CourseGrades implements OnInit {
  public courseId = input.required<string>();
  public currentPeriod = input<string | null>();
  #store = inject(Store);
  #apollo = inject(Apollo);
  #modal = inject(Modal);
  #injector = inject(Injector);

  public periodId = signal<string>('');

  public periodsResource = rxResource({
    params: () => ({
      schoolId: this.#store.currentSchoolId(),
    }),
    stream: ({ params }) => {
      const { schoolId } = params;
      if (!schoolId) {
        return of([]);
      }
      return this.#apollo
        .watchQuery<{
          periodsBySchoolId: Prisma.PeriodGetPayload<{
            include: undefined;
          }>[];
        }>({
          query: gql`
            query PeriodsBySchoolId($schoolId: String!) {
              periodsBySchoolId(schoolId: $schoolId) {
                id
                name
                shortName
              }
            }
          `,
          variables: {
            schoolId: params.schoolId,
          },
          fetchPolicy: 'cache-first',
        })
        .valueChanges.pipe(map((result) => result.data.periodsBySchoolId));
    },
  });

  ngOnInit() {
    effect(
      () => {
        this.periodId.set(this.currentPeriod() || '');
      },
      { injector: this.#injector }
    );
  }

  public gradesResource = rxResource({
    params: () => ({
      courseId: this.courseId(),
      periodId: this.periodId(),
    }),
    stream: ({ params }) => {
      const { courseId, periodId } = params;
      if (!courseId || !periodId) {
        return of([]);
      }
      return this.#apollo
        .watchQuery<{
          gradesByCourseId: Prisma.GradeGetPayload<{
            include: {
              bucket: true;
              gradeStudents: {
                include: {
                  student: { include: { classGroup: true } };
                };
              };
            };
          }>[];
        }>({
          query: gql`
            query GradesByCourseId($courseId: String!, $periodId: String!) {
              gradesByCourseId(courseId: $courseId, periodId: $periodId) {
                id
                title
                comments
                bucket {
                  id
                  name
                }
                gradeStudents {
                  id
                  student {
                    id
                    firstName
                    fatherName
                  }
                  score
                  comments
                  updatedAt
                }
                published
                date
                createdAt
                updatedAt
              }
            }
          `,
          variables: {
            courseId,
            periodId,
          },
        })
        .valueChanges.pipe(map((result) => result.data.gradesByCourseId));
    },
  });

  public groupedGrades = computed(() => {
    const grades = this.gradesResource.value();
    if (!grades) {
      return [];
    }
    console.log(grades);
    const groupedGrades = grades.reduce((acc, grade) => {
      const classGroup = grade.gradeStudents[0].student.classGroup;
      if (!acc[classGroup.id]) {
        acc[classGroup.id] = {
          classGroup,
          grades: [],
        };
      }
      acc[classGroup.id].grades.push(grade);
      return acc;
    }, {} as Record<string, { classGroup: Prisma.ClassGroupGetPayload<{ include: undefined }>; grades: Prisma.GradeGetPayload<{ include: { bucket: true; gradeStudents: { include: { student: { include: { classGroup: true } } } } } }>[] }>);
    return Object.values(groupedGrades);
  });

  editGrade() {
    this.#modal.open(GradesForm, {
      title: 'Nueva calificacion',
      size: 'large',
      data: {
        courseId: this.courseId(),
        currentPeriod: this.currentPeriod(),
      },
    });
  }
}
