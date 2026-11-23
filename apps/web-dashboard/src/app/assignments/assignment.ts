import {
  Badge,
  Breadcrumbs,
  Card,
  CardBody,
  CardTitle,
  EditorViewer,
  Error as ErrorComponent,
  Icon,
  Loader,
} from '#/ui';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import Auth from '../auth/auth';
import { isValidId } from '../core/validators';
import AssignmentSubmissionForm from './assignment-submission-form';
import AssignmentSubmissionsList from './assignment-submissions-list';

type AssignmentDetail = {
  id: string;
  title: string;
  details: string;
  date: string;
  requireSubmission: boolean;
  course: { id: string; name: string };
  teacher?: { user?: { id?: string }; userId?: string | null };
};

@Component({
  imports: [
    Breadcrumbs,
    Badge,
    Card,
    CardBody,
    CardTitle,
    RouterLink,
    DatePipe,
    Loader,
    EditorViewer,
    ErrorComponent,
    AssignmentSubmissionForm,
    AssignmentSubmissionsList,
    Icon,
  ],
  template: `
    @defer {
      @if (assignmentResource.hasValue() && assignmentResource.value()) {
        @let assignment = assignmentResource.value()!;
        <ui-breadcrumbs
          [items]="[
            { label: 'Inicio', link: '/' },
            { label: 'Asignaciones', link: '/assignments' },
            { label: assignment.title },
          ]"
        />
        <div uiCard class="mt-4">
          <div uiCardBody class="flex flex-row justify-between items-start">
            <div>
              <h1 class="text-xl font-semibold mb-2">{{ assignment.title }}</h1>
              <a uiBadge tone="action" [routerLink]="['/courses', assignment.course.id]">
                {{ assignment.course.name }}
              </a>
              <p class="flex items-center gap-2 mt-2">
                <ui-icon name="calendar-days" />
                {{ assignment.date | date: 'medium' }}
              </p>
            </div>
          </div>
        </div>
        <div uiCard class="mt-4">
          <div uiCardBody>
            <h3 uiCardTitle>Detalles</h3>
            <lib-editor-viewer class="type-body" [innerHTML]="assignment.details" />
          </div>
        </div>

        @if (assignment.requireSubmission) {
          <div uiCard class="mt-4">
            <div uiCardBody>
              <h3 uiCardTitle class="flex items-center gap-2">
                <ui-icon name="clipboard-check" />
                Entregas
              </h3>
              @if (auth.isStudent()) {
                <app-assignment-submission-form [assignmentId]="assignment.id" />
              }
              @if (auth.isAdmin() || auth.isTeacher()) {
                <app-assignment-submissions-list [assignmentId]="assignment.id" />
              }
            </div>
          </div>
        }
      } @else if (assignmentResource.error()) {
        <lib-error
          (retry)="assignmentResource.reload()"
          [description]="$safeNavigationMigration(assignmentResource.error()?.message)"
        />
      } @else {
        <div>No se encontró la asignación</div>
      }
    } @placeholder (minimum 1s) {
      <lib-loader />
    } @loading (after 100ms; minimum 1s) {
      <lib-loader />
    }
  `,
})
export default class Assignment {
  public id = input.required<string>();
  public auth = inject(Auth);

  public assignmentResource = httpResource<AssignmentDetail>(() => {
    if (!isValidId(this.id())) return undefined;
    return {
      url: `/api/v1/assignments/${this.id()}`,
      error: (err: Error) => {
        console.error(err);
        return new Error('Error al cargar la asignación');
      },
    };
  });
}
