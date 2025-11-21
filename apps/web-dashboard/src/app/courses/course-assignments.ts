import { Calendar } from '@/ui';
import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { map } from 'rxjs';

@Component({
  selector: 'app-course-assignments',
  imports: [Calendar, DatePipe, RouterLink],
  template: `<lib-calendar
      (monthChange)="monthChange($event)"
      [markers]="assigments.value() ?? []"
      [markerTpl]="assignmentsTpl"
    />
    <ng-template #assignmentsTpl let-data>
      <div class="flex flex-col gap-2">
        @for (marker of data; track marker.id) {
        <div
          class="flex items-center gap-2 justify-between cursor-pointer"
          [routerLink]="['/assignments', marker.data.id]"
        >
          <div
            class="overflow-hidden text-ellipsis text-base-content whitespace-nowrap text-xs"
          >
            {{ marker.data.title }}
          </div>
          <time
            [attr.datetime]="marker.date | date : 'yyyy-MM-dd'"
            class="text-base-200 text-xs flex-none"
          >
            {{ marker.date | date : 'h:mm a' }}
          </time>
        </div>
        }
      </div>
    </ng-template>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CourseAssignments {
  #apollo = inject(Apollo);
  public currentMonth = signal({ start: new Date(), end: new Date() });
  public courseId = input.required<string>();

  monthChange(val: { start: Date; end: Date }) {
    this.currentMonth.set(val);
  }

  assigments = rxResource({
    params: () => this.currentMonth(),
    stream: ({ params }) => {
      const { start, end } = params;
      return this.#apollo
        .watchQuery<{
          assignmentsByCourseId: Prisma.AssignmentGetPayload<{
            include: undefined;
          }>[];
        }>({
          query: gql`
            query AssignmentsByCourseId(
              $courseId: String!
              $endDate: String!
              $startDate: String!
            ) {
              assignmentsByCourseId(
                courseId: $courseId
                endDate: $endDate
                startDate: $startDate
              ) {
                id
                title
                details
                date
              }
            }
          `,
          variables: {
            courseId: this.courseId(),
            startDate: start,
            endDate: end,
          },
        })
        .valueChanges.pipe(
          map((res) =>
            res.data.assignmentsByCourseId.map(({ date, ...rest }) => ({
              date: new Date(date),
              data: rest,
            }))
          )
        );
    },
  });
}
