import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { map, of } from 'rxjs';
import Store from '../core/store';
@Component({
  selector: 'app-course-student-grades',
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <h1 class="text-xl font-semibold">Calificaciones</h1>
      </div>
    </div>
  `,
})
export default class CourseStudentGrades {
  public courseId = input.required<string>();
  #store = inject(Store);
  #apollo = inject(Apollo);
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
        .query<{
          periodsBySchoolId: Prisma.PeriodGetPayload<{ include: undefined }>[];
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
            schoolId,
          },
          fetchPolicy: 'cache-first',
        })
        .pipe(map((result) => result.data.periodsBySchoolId));
    },
  });
}
