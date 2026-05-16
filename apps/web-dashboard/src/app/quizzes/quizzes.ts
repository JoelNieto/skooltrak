import { Confirmation, Error, Loader, Toast } from '@/ui';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { filter, map, of, switchMap } from 'rxjs';
import Auth from '../auth/auth';
import Store from '../core/store';
import { StripHtmlPipe } from '../assignments/assignments';

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
  imports: [RouterLink, DatePipe, Loader, Error, StripHtmlPipe],
  template: `
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Quizes</li>
      </ul>
    </div>
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold mb-2">Quizes</h1>
      @if (auth.hasPermission('MANAGE_QUIZZES')) {
        <a class="btn btn-primary" routerLink="new">Nuevo quiz</a>
      }
    </div>
    <div class="overflow-x-auto bg-base-100 rounded-lg shadow-sm mt-4 border border-base-300">
      @if (quizzesResource.hasValue()) {
        @let list = quizzesResource.value() ?? [];
        <table class="table">
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
                      <a [routerLink]="['/quizzes', item.id]" class="btn btn-ghost btn-sm">Ver</a>
                      <a [routerLink]="['/quizzes', item.id, 'edit']" class="btn btn-ghost btn-sm">Editar</a>
                      <button class="btn btn-ghost btn-sm" (click)="deleteQuiz(item)">
                        <span class="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  }
                </td>
              </tr>
            }
            @empty {
              <tr>
                <td colspan="6" class="text-center py-8 text-base-content/60">
                  No hay quizzes
                </td>
              </tr>
            }
          </tbody>
        </table>
      } @else if (quizzesResource.error()) {
        <lib-error
          (retry)="quizzesResource.reload()"
          [description]="quizzesResource.error()?.message"
        />
      } @else {
        <lib-loader />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Quizzes {
  public store = inject(Store);
  private http = inject(HttpClient);
  public auth = inject(Auth);
  private confirmation = inject(Confirmation);
  private toast = inject(Toast);

  public quizzesResource = rxResource({
    params: () => ({
      organizationId: this.store.currentOrganizationId(),
    }),
    stream: ({ params }) => {
      if (!params.organizationId) {
        return of([]);
      }
      return this.http
        .get<QuizListItem[]>(`/api/v1/quizzes`, {
          params: { organizationId: params.organizationId },
        })
        .pipe(map((rows) => rows ?? []));
    },
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
