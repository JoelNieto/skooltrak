import { Breadcrumbs, Button, Confirmation, Error, Icon, Loader, Toast, UiTable } from '#/ui';
import { DatePipe } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { Component, inject } from '@angular/core';
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
  imports: [Breadcrumbs, UiTable, Button, RouterLink, DatePipe, Loader, Error, StripHtmlPipe, Icon],
  template: `
    <ui-breadcrumbs [items]="[{ label: 'Inicio', link: '/' }, { label: 'Quizes' }]" />
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold mb-2">Quizes</h1>
      @if (auth.hasPermission('MANAGE_QUIZZES')) {
        <a uiButton variant="primary" routerLink="new">Nuevo quiz</a>
      }
    </div>
    <div class="overflow-x-auto bg-surface-1 rounded-lg shadow-sm mt-4 border border-line">
      @if (quizzesResource.hasValue()) {
        @let list = quizzesResource.value() ?? [];
        <table uiTable>
          <thead>
            <tr>
              <th>Título</th>
              <th>Descripción</th>
              <th>Curso</th>
              <th>Profesor</th>
              <th>Creado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (item of list; track item.id) {
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
                  @if (auth.hasPermission('MANAGE_QUIZZES')) {
                    <div class="flex gap-2">
                      <a uiButton variant="ghost" size="sm" [routerLink]="['/quizzes', item.id]">Ver</a>
                      <a uiButton variant="ghost" size="sm" [routerLink]="['/quizzes', item.id, 'edit']">Editar</a>
                      <button uiButton variant="ghost" size="sm" (click)="deleteQuiz(item)">
                        <ui-icon name="trash-2" />
                      </button>
                    </div>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="text-center py-8 text-ink-muted">No hay quizzes</td>
              </tr>
            }
          </tbody>
        </table>
      } @else if (quizzesResource.error()) {
        <lib-error
          (retry)="quizzesResource.reload()"
          [description]="$safeNavigationMigration(quizzesResource.error()?.message)"
        />
      } @else {
        <lib-loader />
      }
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
