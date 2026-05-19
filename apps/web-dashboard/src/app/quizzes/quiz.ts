import { Confirmation, EditorViewer, Error as ErrorComponent, Loader, Toast } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { filter, map, of, switchMap } from 'rxjs';
import Auth from '../auth/auth';

const QUESTION_TYPE_LABELS: Record<string, string> = {
  TEXT: 'Texto',
  SINGLE_CHOICE: 'Elección simple',
  MULTIPLE_CHOICE: 'Elección múltiple',
  TRUE_FALSE: 'Verdadero o falso',
  MATCH: 'Emparejar',
};

type QuizDetail = {
  id: string;
  title: string;
  details: string;
  course: { id: string; name: string };
  teacher?: { firstName?: string; fatherName?: string } | null;
  questions: Array<{
    id: string;
    type: string;
    question: string;
    timeLimit?: number | null;
    options?: Array<{ id: string; option: string; isCorrect: boolean }>;
  }>;
};

@Component({
  selector: 'app-quiz',
  imports: [RouterLink, Loader, EditorViewer, ErrorComponent],
  template: `
    @defer {
      @if (quizResource.hasValue()) {
        @let quiz = quizResource.value()!;
        <div class="breadcrumbs text-sm">
          <ul>
            <li><a routerLink="/">Inicio</a></li>
            <li><a routerLink="/quizzes">Quizes</a></li>
            <li>{{ quiz.title }}</li>
          </ul>
        </div>
        <div class="card card-border border-base-300 bg-base-100 mt-4">
          <div class="card-body">
            <div class="flex justify-between items-start">
              <div>
                <h1 class="text-xl font-semibold mb-2">{{ quiz.title }}</h1>
                <a class="badge badge-primary badge-soft" [routerLink]="['/courses', quiz.course.id]">
                  {{ quiz.course.name }}
                </a>
                @if (quiz.teacher) {
                  <p class="mt-2 flex items-center gap-2 text-sm text-base-content/70">
                    <span class="material-symbols-outlined text-lg">person</span>
                    {{ quiz.teacher.firstName }} {{ quiz.teacher.fatherName }}
                  </p>
                }
              </div>
              @if (auth.hasPermission('MANAGE_QUIZZES')) {
                <div class="flex gap-2">
                  <a [routerLink]="['/quizzes', quiz.id, 'edit']" class="btn btn-primary btn-sm">
                    <span class="material-symbols-outlined">edit</span>
                    Editar
                  </a>
                  <button class="btn btn-error btn-sm btn-soft" (click)="deleteQuiz(quiz)">
                    <span class="material-symbols-outlined">delete</span>
                    Eliminar
                  </button>
                </div>
              }
            </div>
          </div>
        </div>
        <div class="card card-border border-base-300 bg-base-100 mt-4">
          <div class="card-body">
            <h3 class="card-title">Descripción</h3>
            <lib-editor-viewer [innerHTML]="quiz.details" />
          </div>
        </div>
        <div class="card card-border border-base-300 bg-base-100 mt-4">
          <div class="card-body">
            <h3 class="card-title flex items-center gap-2">
              <span class="material-symbols-outlined">quiz</span>
              Preguntas ({{ quiz.questions.length }})
            </h3>
            <div class="flex flex-col gap-4">
              @for (q of quiz.questions; track q.id; let i = $index) {
                <div class="card bg-base-200">
                  <div class="card-body py-4">
                    <div class="flex justify-between items-start">
                      <h4 class="font-semibold">Pregunta {{ i + 1 }}</h4>
                      <span class="badge badge-ghost badge-sm">
                        {{ QUESTION_TYPE_LABELS[q.type] ?? q.type }}
                      </span>
                    </div>
                    <div class="prose prose-sm max-w-none" [innerHTML]="q.question"></div>
                    @if (q.timeLimit && q.timeLimit > 0) {
                      <p class="text-sm text-base-content/60">
                        <span class="material-symbols-outlined text-base align-middle">timer</span>
                        {{ q.timeLimit }} segundos
                      </p>
                    }
                    @if (q.options?.length) {
                      <ul class="list-disc list-inside mt-2 space-y-1">
                        @for (opt of q.options; track opt.id) {
                          <li class="flex items-center gap-2">
                            {{ opt.option }}
                            @if (opt.isCorrect) {
                              <span class="badge badge-success badge-sm gap-1">
                                <span class="material-symbols-outlined text-sm!">check_circle</span>
                                Correcta
                              </span>
                            }
                          </li>
                        }
                      </ul>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      } @else if (quizResource.error()) {
        <lib-error (retry)="quizResource.reload()" [description]="quizResource.error()?.message" />
      } @else {
        <div>No se encontró el quiz</div>
      }
    } @placeholder (minimum 1s) {
      <lib-loader />
    } @loading (after 100ms; minimum 1s) {
      <lib-loader />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Quiz {
  readonly QUESTION_TYPE_LABELS = QUESTION_TYPE_LABELS;
  public id = input.required<string>();
  private http = inject(HttpClient);
  private router = inject(Router);
  public auth = inject(Auth);
  private confirmation = inject(Confirmation);
  private toast = inject(Toast);

  public quizResource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => {
      const { id } = params;
      if (!id) return of(null);
      return this.http.get<QuizDetail>(`/api/v1/quizzes/${id}`).pipe(
        map((res) => {
          if (res) return res;
          throw new Error('Quiz not found');
        }),
      );
    },
  });

  deleteQuiz(quiz: { id: string; title: string }) {
    this.confirmation
      .confirm({
        title: 'Eliminar quiz',
        message: `¿Estás seguro de eliminar "${quiz.title}"?`,
      })
      .pipe(
        filter((result) => result),
        switchMap(() => this.http.delete(`/api/v1/quizzes/${quiz.id}`)),
      )
      .subscribe({
        next: () => {
          this.toast.showSuccess('Quiz eliminado correctamente');
          this.router.navigate(['/quizzes']);
        },
        error: (err: { message?: string }) => {
          this.toast.showError(err.message || 'Error al eliminar el quiz');
        },
      });
  }
}
