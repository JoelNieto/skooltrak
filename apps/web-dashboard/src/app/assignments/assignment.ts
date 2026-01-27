import { EditorViewer, Loader } from '@/ui';
import { DatePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Prisma } from '@generated/prisma';
import Auth from '../auth/auth';

import { Apollo, gql } from 'apollo-angular';
import { map } from 'rxjs';
import AssignmentSubmissionForm from './assignment-submission-form';
import AssignmentSubmissionsList from './assignment-submissions-list';

@Component({
  imports: [RouterLink, DatePipe, Loader, EditorViewer, AssignmentSubmissionForm, AssignmentSubmissionsList],

  template: `
    @defer {
      @if (assignmentResource.hasValue()) {
        @let assignment = assignmentResource.value();
        <div class="breadcrumbs text-sm">
          <ul>
            <li><a routerLink="/">Inicio</a></li>
            <li><a routerLink="/assignments">Asignaciones</a></li>
            <li>{{ assignment.title }}</li>
          </ul>
        </div>
        <div class="card card-border border-base-300 bg-base-100 mt-4">
          <div class="card-body">
            <h1 class="text-xl font-semibold mb-2">{{ assignment.title }}</h1>
            <a class="badge badge-primary badge-soft" [routerLink]="['/courses', assignment.course.id]">
              {{ assignment.course.name }}
            </a>
            <p class="flex items-center gap-2">
              <span class="material-symbols-outlined">calendar_month</span>
              {{ assignment.date | date: 'medium' }}
            </p>
          </div>
        </div>
        <div class="card card-border border-base-300 bg-base-100 mt-4">
          <div class="card-body">
            <h3 class="card-title">Detalles</h3>
            <lib-editor-viewer [innerHTML]="assignment.details" />
          </div>
        </div>

        @if (assignment.requireSubmission) {
          <div class="card card-border border-base-300 bg-base-100 mt-4">
            <div class="card-body">
              <h3 class="card-title flex items-center gap-2">
                <span class="material-symbols-outlined">assignment_turned_in</span>
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
      }
    } @placeholder (minimum 1s) {
      <lib-loader />
    } @loading (after 100ms; minimum 1s) {
      <lib-loader />
    }
  `,
})
export default class Assigment {
  public id = input.required<string>();
  private apollo = inject(Apollo);
  public auth = inject(Auth);
  public assignmentResource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => {
      const { id } = params;
      return this.apollo
        .watchQuery<{
          assignment: Prisma.AssignmentGetPayload<{
            include: {
              course: true;
              teacher: true;
            };
          }>;
        }>({
          query: gql`
            query Assignment($id: String!) {
              assignment(id: $id) {
                id
                title
                details
                course {
                  id
                  name
                }
                teacher {
                  id
                  firstName
                  fatherName
                }
                date
                createdAt
                updatedAt
                requireSubmission
              }
            }
          `,
          variables: { id },
        })
        .valueChanges.pipe(map((res) => res.data.assignment));
    },
  });
}
