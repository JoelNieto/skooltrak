import { Calendar } from '@/ui';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { map } from 'rxjs';
import Auth from '../auth/auth';
import Store from '../core/store';
import { AssignmentDatesByCourseIdDocument, AssignmentDatesByCourseIdQuery } from '../graphql/generated/graphql';

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
            <div class="overflow-hidden text-ellipsis text-base-content whitespace-nowrap text-xs">
              {{ marker.data.title }}
              @if (!isStudent() && marker.data.groupName) {
                <span class="text-base-300 ml-1">({{ marker.data.groupName }})</span>
              }
            </div>
            <time [attr.datetime]="marker.date | date: 'yyyy-MM-dd'" class="text-base-200 text-xs flex-none">
              {{ marker.date | date: 'h:mm a' }}
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
        .watchQuery({
          query: AssignmentDatesByCourseIdDocument,
          variables: {
            courseId: this.courseId(),
            startDate: start instanceof Date ? start.toISOString() : String(start),
            endDate: end instanceof Date ? end.toISOString() : String(end),
            classGroupId: classGroupId || null,
          },
        })
        .valueChanges.pipe(
          map((res) =>
            (
              (res.data?.assignmentDatesByCourseId as AssignmentDatesByCourseIdQuery['assignmentDatesByCourseId']) ?? []
            ).map((item) => ({
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
            })),
          ),
        );
    },
  });
}
