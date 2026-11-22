import { Component, input, output } from '@angular/core';
import CourseAssignments from './course-assignments';

/**
 * The course's assignments calendar in a dialog: "Ver calendario" on the course page header for
 * students and parents (ACA-001 FR .10), whose tabs have no Calendario of their own.
 */
@Component({
  selector: 'app-course-calendar-dialog',
  imports: [CourseAssignments],
  template: `<app-course-assignments [courseId]="data().courseId" />`,
})
export default class CourseCalendarDialog {
  readonly data = input.required<{ courseId: string }>();
  readonly closeModal = output<void>();
}
