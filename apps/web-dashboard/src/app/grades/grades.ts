import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import Store from '../core/store';

@Component({
  selector: 'app-grades',
  imports: [RouterLink, FormsModule],
  template: `<div class="breadcrumbs">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Calificaciones</li>
      </ul>
    </div>
    <h1 class="text-2xl font-semibold mb-2">Calificaciones</h1>
    <div class="flex flex-col md:flex-row gap-4">
      <select
        class="select select-primary"
        [ngModel]="planId()"
        (ngModelChange)="planId.set($event)"
      >
        <option disabled selected value="">Selecciona un plan...</option>
        @for(plan of plansResource.value()!; track plan.id) {
        <option value="{{ plan.id }}">{{ plan.name }}</option>
        }
      </select>
      <select
        class="select select-primary"
        [ngModel]="courseId()"
        (ngModelChange)="courseId.set($event)"
      >
        <option disabled selected value="">Selecciona un curso...</option>
        @for(course of coursesResource.value()!; track course.id) {
        <option value="{{ course.id }}">{{ course.name }}</option>
        }
      </select>
      <select
        class="select select-primary"
        [ngModel]="periodId()"
        (ngModelChange)="periodId.set($event)"
      >
        <option disabled selected value="">Selecciona un periodo...</option>
        @for(period of periodsResource.value()!; track period.id) {
        <option value="{{ period.id }}">{{ period.name }}</option>
        }
      </select>
    </div> `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Grades {
  #store = inject(Store);
  #apollo = inject(Apollo);
  public periodId = signal<string>('');
  public planId = signal<string>('');
  public courseId = signal<string>('');
  public plansResource = rxResource({
    params: () => ({
      schoolId: this.#store.currentSchoolId(),
    }),
    stream: ({ params }) => {
      if (!params.schoolId) {
        return of([]);
      }
      return this.#apollo
        .watchQuery<{
          studyPlansBySchoolId: Prisma.StudyPlanGetPayload<{
            include: { degree: true; school: true; gradeMetric: true };
          }>[];
        }>({
          query: gql`
            query StudyPlansBySchoolId($schoolId: String!) {
              studyPlansBySchoolId(schoolId: $schoolId) {
                id
                name
                code
              }
            }
          `,
          variables: {
            schoolId: params.schoolId,
          },
        })
        .valueChanges.pipe(map((result) => result.data.studyPlansBySchoolId));
    },
  });

  public coursesResource = rxResource({
    params: () => ({
      studyPlanId: this.planId(),
    }),
    stream: ({ params }) => {
      const { studyPlanId } = params;
      if (!studyPlanId) {
        return of([]);
      }
      this.courseId.set('');
      return this.#apollo
        .watchQuery<{
          coursesByStudyPlanId: Prisma.CourseGetPayload<{
            include: undefined;
          }>[];
        }>({
          query: gql`
            query CoursesByStudyPlanId($studyPlanId: String!) {
              coursesByStudyPlanId(studyPlanId: $studyPlanId) {
                id
                name
                currentPeriodId
              }
            }
          `,
          variables: {
            studyPlanId,
          },
          fetchPolicy: 'cache-first',
        })
        .valueChanges.pipe(map((result) => result.data.coursesByStudyPlanId));
    },
  });

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
}
