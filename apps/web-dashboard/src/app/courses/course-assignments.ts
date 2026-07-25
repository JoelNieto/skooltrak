import { Calendar } from '#/ui';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import Auth from '../auth/auth';
import Store from '../core/store';

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
})
export default class CourseAssignments {
  #http = inject(HttpClient);
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
      return this.#http
        .get<any[]>(`/api/v1/assignments/dates/by-course`, {
          params: {
            courseId: this.courseId(),
            startDate: start instanceof Date ? start.toISOString() : String(start),
            endDate: end instanceof Date ? end.toISOString() : String(end),
            classGroupId: classGroupId || '',
          },
        })
        .pipe(
          map((res) =>
            (res ?? []).map((item) => ({
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
