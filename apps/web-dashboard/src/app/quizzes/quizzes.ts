import {
  Breadcrumbs,
  Button,
  Card,
  Confirmation,
  Toast,
  UiRowAction,
  UiRowActions,
  UiTable,
  UiTableEmpty,
  UiTableError,
  UiTableSkeleton,
  listState,
} from '#/ui';
import { DatePipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { filter, switchMap } from 'rxjs';
import { StripHtmlPipe } from '../assignments/assignments';
import Auth from '../auth/auth';
import Store from '../core/store';

type QuizListItem = {
  id: string;
  title: string;
  details: string;
  createdAt: string;
  course?: { name?: string | null } | null;
  teacher?: { firstName?: string; fatherName?: string } | null;
};

@Component({
  selector: 'app-quizzes',
  imports: [
    Breadcrumbs,
    Card,
    UiTable,
    UiTableEmpty,
    UiTableError,
    UiTableSkeleton,
    UiRowActions,
    Button,
    RouterLink,
    DatePipe,
    StripHtmlPipe,
  ],
  template: `
    <ui-breadcrumbs [items]="[{ label: 'Inicio', link: '/' }, { label: 'Quizes' }]" />
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold mb-2">Quizes</h1>
      @if (canManage()) {
        <a uiButton variant="primary" routerLink="new">Nuevo quiz</a>
      }
    </div>
    <div uiCard class="overflow-x-auto mt-4">
      <table uiTable [attr.aria-busy]="quizzesResource.isLoading()">
        <thead>
          <tr>
            <th>Título</th>
            <th>Descripción</th>
            <th>Curso</th>
            <th>Profesor</th>
            <th>Creado</th>
            <th class="w-12"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        @switch (quizzesList.phase()) {
          @case ('skeleton') {
            <tbody uiTableSkeleton [columns]="6"></tbody>
          }
          @case ('error') {
            <tbody>
              <tr uiTableError [columns]="6" (retry)="quizzesResource.reload()"></tr>
            </tbody>
          }
          @case ('ready') {
            <tbody>
              @for (item of quizzesList.rows() ?? []; track item.id) {
                <tr>
                  <td>
                    <a [routerLink]="['/quizzes', item.id]" class="link link-primary">
                      {{ item.title }}
                    </a>
                  </td>
                  <td class="max-w-[24rem] truncate">
                    {{ item.details | stripHtml }}
                  </td>
                  <td>{{ item.course?.name ?? '-' }}</td>
                  <td>
                    {{ item.teacher ? item.teacher.firstName + ' ' + item.teacher.fatherName : '-' }}
                  </td>
                  <td>{{ item.createdAt | date: 'short' }}</td>
                  <td>
                    @if (canManage()) {
                      <ui-row-actions
                        [actions]="rowActions(item)"
                        [label]="'Acciones para ' + item.title"
                        (action)="onRowAction($event, item)"
                      />
                    }
                  </td>
                </tr>
              } @empty {
                <tr uiTableEmpty [columns]="6" icon="list-checks" title="Aún no hay quizzes">
                  @if (canManage()) {
                    <a uiButton size="sm" routerLink="new">Nuevo quiz</a>
                  }
                </tr>
              }
            </tbody>
          }
        }
      </table>
    </div>
  `,
})
export default class Quizzes {
  public store = inject(Store);
  private http = inject(HttpClient);
  public auth = inject(Auth);
  private confirmation = inject(Confirmation);
  private toast = inject(Toast);

  public quizzesResource = httpResource<QuizListItem[]>(() => {
    const organizationId = this.store.currentOrganizationId();
    if (!organizationId) return undefined;
    return {
      url: '/api/v1/quizzes',
      params: { organizationId },
    };
  });

  /** quizzes with smooth loading: rows stay while the list reloads after a delete. */
  protected readonly quizzesList = listState(this.quizzesResource);

  protected readonly canManage = computed(() => this.auth.hasPermission('MANAGE_QUIZZES'));

  /** The actions in each row's menu (ui-row-actions). */
  protected rowActions(quiz: QuizListItem): UiRowAction[] {
    return [
      { id: 'view', label: 'Ver', icon: 'eye', link: ['/quizzes', quiz.id] },
      { id: 'edit', label: 'Editar', icon: 'pencil', link: ['/quizzes', quiz.id, 'edit'] },
      { id: 'delete', label: 'Eliminar', icon: 'trash-2', tone: 'danger' },
    ];
  }

  protected onRowAction(action: string, quiz: QuizListItem): void {
    if (action === 'delete') this.deleteQuiz(quiz);
  }

  deleteQuiz(quiz: { id?: string; title?: string }) {
    if (!quiz.id) return;
    this.confirmation
      .confirm({
        title: 'Eliminar quiz',
        message: `¿Estás seguro de eliminar "${quiz.title ?? 'este quiz'}"?`,
      })
      .pipe(
        filter((result) => result),
        switchMap(() => this.http.delete(`/api/v1/quizzes/${quiz.id}`)),
      )
      .subscribe({
        next: () => {
          this.toast.showSuccess('Quiz eliminado correctamente');
          this.quizzesResource.reload();
        },
        error: (err: { message?: string }) => {
          this.toast.showError(err.message || 'Error al eliminar el quiz');
        },
      });
  }
}
