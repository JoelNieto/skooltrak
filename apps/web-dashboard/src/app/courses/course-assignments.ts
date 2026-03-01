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
import { Apollo, gql } from 'apollo-angular';
import { map } from 'rxjs';
import Auth from '../auth/auth';
import Store from '../core/store';

type AssignmentDateResult = {
  id: string;
  date: string;
  classGroupId: string;
  classGroup: {
    id: string;
    name: string;
  };
  assignment: {
    id: string;
    title: string;
    details: string;
    type: string;
    requireSubmission: boolean;
  };
};

@Component({
  selector: 'app-course-assignments',
  imports: [Calendar, DatePipe, RouterLink],
  template: `<lib-calendar
      (monthChange)="monthChange($event)"
      [markers]="assignmentDates.value() ?? []"
      [markerTpl]="assignmentsTpl"
    />
    <ng-template #assignmentsTpl let-data>
      <div class="flex flex-col gap-2">
        @for (marker of data; track marker.data.id + marker.data.groupId) {
          <div
            class="flex items-center gap-2 justify-between cursor-pointer"
            [routerLink]="['/assignments', marker.data.assignmentId]"
          >
            <div
              class="overflow-hidden text-ellipsis text-base-content whitespace-nowrap text-xs"
            >
              {{ marker.data.title }}
              @if (!isStudent() && marker.data.groupName) {
                <span class="text-base-300 ml-1">({{ marker.data.groupName }})</span>
              }
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
  #auth = inject(Auth);
  #store = inject(Store);

  public currentMonth = signal({ start: new Date(), end: new Date() });
  public courseId = input.required<string>();

  public isStudent = this.#auth.isStudent;

  monthChange(val: { start: Date; end: Date }) {
    this.currentMonth.set(val);
  }

  assignmentDates = rxResource({
    params: () => ({
      ...this.currentMonth(),
      classGroupId: this.#store.currentStudentGroupId(),
    }),
    stream: ({ params }) => {
      const { start, end, classGroupId } = params;
      return this.#apollo
        .watchQuery<{
          assignmentDatesByCourseId: AssignmentDateResult[];
        }>({
          query: gql`
            query AssignmentDatesByCourseId(
              $courseId: String!
              $endDate: String!
              $startDate: String!
              $classGroupId: String
            ) {
              assignmentDatesByCourseId(
                courseId: $courseId
                endDate: $endDate
                startDate: $startDate
                classGroupId: $classGroupId
              ) {
                id
                date
                classGroupId
                classGroup {
                  id
                  name
                }
                assignment {
                  id
                  title
                  details
                  type
                  requireSubmission
                }
              }
            }
          `,
          variables: {
            courseId: this.courseId(),
            startDate: start,
            endDate: end,
            classGroupId: classGroupId || null,
          },
        })
        .valueChanges.pipe(
          map((res) =>
            (res.data?.assignmentDatesByCourseId ?? []).map((item) => ({
              date: new Date(item.date),
              data: {
                id: item.id,
                assignmentId: item.assignment.id,
                title: item.assignment.title,
                details: item.assignment.details,
                type: item.assignment.type,
                groupId: item.classGroupId,
                groupName: item.classGroup?.name,
              },
            }))
          )
        );
    },
  });
}
