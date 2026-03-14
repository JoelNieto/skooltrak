import { EditorViewer, Error as ErrorComponent, Loader, Toast } from '@/ui';
import { DatePipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import Auth from '../auth/auth';
import { isValidId } from '../core/validators';

import { Apollo } from 'apollo-angular';
import { filter, map, of } from 'rxjs';
import {
  AssignmentDocument,
  AssignmentQuery,
  ChatType,
  ChatsCreateContextualChatDocument,
} from '../graphql/generated/graphql';
import AssignmentSubmissionForm from './assignment-submission-form';
import AssignmentSubmissionsList from './assignment-submissions-list';

@Component({
  imports: [
    RouterLink,
    DatePipe,
    Loader,
    EditorViewer,
    ErrorComponent,
    AssignmentSubmissionForm,
    AssignmentSubmissionsList,
  ],

  template: `
    @defer {
      @if (assignmentResource.hasValue() && assignmentResource.value()) {
        @let assignment = assignmentResource.value()!;
        <div class="breadcrumbs text-sm">
          <ul>
            <li><a routerLink="/">Inicio</a></li>
            <li><a routerLink="/assignments">Asignaciones</a></li>
            <li>{{ assignment.title }}</li>
          </ul>
        </div>
        <div class="card card-border border-base-300 bg-base-100 mt-4">
          <div class="card-body flex flex-row justify-between items-start">
            <div>
              <h1 class="text-xl font-semibold mb-2">{{ assignment.title }}</h1>
              <a class="badge badge-primary badge-soft" [routerLink]="['/courses', assignment.course.id]">
                {{ assignment.course.name }}
              </a>
              <p class="flex items-center gap-2 mt-2">
                <span class="material-symbols-outlined">calendar_month</span>
                {{ assignment.date | date: 'medium' }}
              </p>
            </div>
            @if (canStartAssignmentChat()) {
              <button class="btn btn-ghost btn-sm" (click)="startAssignmentChat()" [disabled]="startingChat()">
                @if (startingChat()) {
                  <span class="loading loading-spinner loading-sm"></span>
                } @else {
                  <span class="material-symbols-outlined">chat</span>
                }
                Chat
              </button>
            }
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
      } @else if (assignmentResource.error()) {
        <lib-error (retry)="assignmentResource.reload()" [description]="assignmentResource.error()?.message" />
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
  private apollo = inject(Apollo);
  private router = inject(Router);
  private toast = inject(Toast);
  public auth = inject(Auth);
  startingChat = signal(false);

  canStartAssignmentChat() {
    if (!this.auth.hasPermission('MANAGE_MESSAGES')) return false;
    const assignment = this.assignmentResource.value();
    if (!assignment) return false;
    return this.auth.isAdmin() || assignment.teacher?.user?.id === this.auth.user()?.id;
  }

  async startAssignmentChat() {
    this.startingChat.set(true);
    try {
      const result = await this.apollo
        .mutate({
          mutation: ChatsCreateContextualChatDocument,
          variables: { input: { contextType: ChatType.Assignment, contextId: this.id() } },
        })
        .toPromise();
      const chat = result?.data?.createContextualChat;
      if (chat?.id) this.router.navigate(['/chats', chat.id]);
    } catch {
      this.toast.showError('Error al crear chat');
    } finally {
      this.startingChat.set(false);
    }
  }

  public assignmentResource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => {
      const { id } = params;
      if (!isValidId(id)) {
        return of(null);
      }
      return this.apollo
        .watchQuery({
          query: AssignmentDocument,
          variables: { id },
        })
        .valueChanges.pipe(
          filter((res) => !res.loading),
          map((res) => {
            if (res.data?.assignment) {
              return res.data.assignment as AssignmentQuery['assignment'];
            }
            throw new Error('Assignment not found');
          }),
        );
    },
  });
}
