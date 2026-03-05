import { Loader, TextEditor, Toast } from '@/ui';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { $Enums } from '@generated/prisma';

import { Apollo } from 'apollo-angular';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import Store from '../core/store';
import { isValidId } from '../core/validators';
import {
  CreateQuizDocument,
  QuizDocument,
  QuizFormCoursesBySchoolIdDocument,
  QuizQuery,
  UpdateQuizDocument,
} from '../graphql/generated/graphql';
import { QuizQuestionControl } from './quiz-question-control';

@Component({
  selector: 'app-quiz-form',
  imports: [RouterLink, ReactiveFormsModule, FormsModule, TextEditor, QuizQuestionControl, Loader],

  template: `
    <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li><a routerLink="/quizzes">Quizes</a></li>
        <li>{{ isEditMode() ? 'Editar' : 'Nuevo quiz' }}</li>
      </ul>
    </div>
    <h1 class="text-2xl font-semibold mb-2">{{ isEditMode() ? 'Editar quiz' : 'Nuevo quiz' }}</h1>

    @if (isEditMode() && quizResource.isLoading()) {
      <lib-loader />
    } @else {
      <form [formGroup]="quizForm" (ngSubmit)="saveChanges()">
        <div class="card bg-base-100 card-border border-neutral-300">
          <div class="card-body">
            <h2 class="card-title">Datos del quiz</h2>
            <div class="flex flex-col gap-4">
              <div class="fieldset">
                <label for="title">Titulo</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  formControlName="title"
                  class="input input-primary"
                  placeholder="Titulo del quiz..."
                />
              </div>
              <div class="fieldset">
                <label for="courseId">Curso</label>
                <select
                  id="courseId"
                  name="courseId"
                  formControlName="courseId"
                  class="select select-primary"
                  placeholder="Selecciona un curso..."
                >
                  <option value="" disabled selected>Selecciona un curso...</option>
                  @for (course of coursesResource.value(); track course.id) {
                    <option [value]="course.id">{{ course.name }}</option>
                  }
                </select>
              </div>
              <div class="fieldset">
                <label for="details">Descripción</label>
                <lib-text-editor id="details" name="details" formControlName="details" [bordered]="true" />
              </div>
            </div>
            <div class="flex justify-end mt-4">
              <button type="submit" class="btn btn-primary" [disabled]="isSaving()">
                @if (isSaving()) {
                  <span class="loading loading-spinner loading-sm"></span>
                }
                Guardar
              </button>
            </div>
          </div>
        </div>
        <div class="card bg-base-100 card-border border-neutral-300 my-4">
          <div class="card-body">
            <h2 class="card-title text-xl font-semibold">Preguntas</h2>

            <div formArrayName="questions" class="flex flex-col gap-4">
              @for (question of questions.controls; track $index) {
                <div class="card bg-base-100 card-border border-neutral-300">
                  <div class="card-body">
                    <div class="flex justify-between">
                      <h2 class="card-title">Pregunta {{ $index + 1 }}</h2>
                      <button type="button" class="btn btn-soft btn-error" (click)="removeQuestion($index)">
                        <span class="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                    <app-quiz-question-control [question]="question" [index]="$index" />
                  </div>
                </div>
              }
              <button type="button" class="btn btn-primary btn-soft" (click)="addQuestion()">
                <span class="material-symbols-outlined">add_circle</span>
                Agregar pregunta
              </button>
            </div>
          </div>
        </div>
      </form>
    }
  `,
})
export default class QuizForm {
  id = input<string>();

  private fb = inject(NonNullableFormBuilder);
  private store = inject(Store);
  private apollo = inject(Apollo);
  private router = inject(Router);
  private toast = inject(Toast);

  isEditMode = computed(() => !!this.id() && isValidId(this.id()));
  isSaving = signal(false);

  // Typed form models
  private createOptionGroup(option?: { option?: string; isCorrect?: boolean }) {
    return this.fb.group<{
      option: FormControl<string>;
      isCorrect: FormControl<boolean>;
    }>({
      option: this.fb.control(option?.option ?? ''),
      isCorrect: this.fb.control(option?.isCorrect ?? false),
    });
  }

  private createQuestionGroup(question?: {
    question?: string;
    value?: number;
    type?: string;
    timeLimit?: number;
    options?: { option?: string; isCorrect?: boolean }[];
  }) {
    return this.fb.group<{
      question: FormControl<string>;
      value: FormControl<number>;
      type: FormControl<$Enums.QuizQuestionType | ''>;
      timeLimit: FormControl<number>;
      options: FormArray<
        FormGroup<{
          option: FormControl<string>;
          isCorrect: FormControl<boolean>;
        }>
      >;
    }>({
      question: this.fb.control(question?.question ?? ''),
      value: this.fb.control(Number(question?.value) || 0),
      type: this.fb.control((question?.type as $Enums.QuizQuestionType) ?? ''),
      timeLimit: this.fb.control((question?.timeLimit as number) ?? 0),
      options: this.fb.array<
        FormGroup<{
          option: FormControl<string>;
          isCorrect: FormControl<boolean>;
        }>
      >(question?.options ? question.options.map((opt) => this.createOptionGroup(opt)) : []),
    });
  }

  public quizResource = rxResource({
    params: () => ({ id: this.id()! }),
    stream: ({ params }) => {
      if (!params.id || !isValidId(params.id)) {
        return of(null);
      }
      return this.apollo
        .watchQuery({
          query: QuizDocument,
          variables: { id: params.id },
        })
        .valueChanges.pipe(
          map((res) => {
            if (res.data?.quiz) {
              return res.data.quiz as QuizQuery['quiz'];
            }
            return null;
          }),
        );
    },
  });

  public coursesResource = rxResource({
    params: () => ({
      schoolId: this.store.currentSchoolId(),
    }),
    stream: ({ params }) => {
      const { schoolId } = params;
      if (!schoolId) {
        return of([]);
      }
      return this.apollo
        .watchQuery({
          query: QuizFormCoursesBySchoolIdDocument,
          variables: {
            schoolId: schoolId,
          },
        })
        .valueChanges.pipe(map((result) => result.data?.coursesBySchoolId ?? []));
    },
  });

  public quizForm = this.fb.group({
    title: this.fb.control('', [Validators.required]),
    details: this.fb.control('', [Validators.required]),
    courseId: this.fb.control('', [Validators.required]),
    questions: this.fb.array<
      FormGroup<{
        question: FormControl<string>;
        value: FormControl<number>;
        type: FormControl<$Enums.QuizQuestionType | ''>;
        timeLimit: FormControl<number>;
        options: FormArray<
          FormGroup<{
            option: FormControl<string>;
            isCorrect: FormControl<boolean>;
          }>
        >;
      }>
    >([this.createQuestionGroup()]),
  });

  public get questions() {
    return this.quizForm.controls.questions;
  }

  constructor() {
    effect(() => {
      const quiz = this.quizResource.value();
      if (this.isEditMode() && quiz) {
        this.quizForm.patchValue({
          title: quiz.title,
          details: quiz.details,
          courseId: quiz.course.id,
        });
        this.questions.clear();
        for (const q of quiz.questions) {
          this.questions.push(
            this.createQuestionGroup({
              question: q.question,
              value: q.value,
              type: q.type,
              timeLimit: q.timeLimit ?? 0,
              options: q.options?.map((o) => ({ option: o.option, isCorrect: o.isCorrect })),
            }),
          );
        }
      }
    });
  }

  addQuestion() {
    this.questions.push(this.createQuestionGroup());
  }

  removeQuestion(index: number) {
    this.questions.removeAt(index);
  }

  saveChanges() {
    if (this.quizForm.invalid) {
      this.quizForm.markAllAsTouched();
      return;
    }

    const teacherId = this.store.currentTeacher()?.id;
    if (!teacherId) {
      this.toast.showError('Debes ser profesor para crear o editar quizzes');
      return;
    }

    const organizationId = this.store.currentOrganizationId();
    if (!organizationId) {
      this.toast.showError('No hay organización seleccionada');
      return;
    }

    const raw = this.quizForm.getRawValue();
    const questions = raw.questions.map((q) => ({
      question: q.question,
      value: String(Number(q.value) || 0),
      type: q.type as string,
      timeLimit: q.timeLimit ?? 0,
      options: (q.options ?? []).map((o) => ({
        option: o.option,
        isCorrect: o.isCorrect,
      })),
    }));

    this.isSaving.set(true);

    if (this.isEditMode()) {
      this.apollo
        .mutate({
          mutation: UpdateQuizDocument,
          variables: {
            updateQuizInput: {
              id: this.id()!,
              title: raw.title,
              details: raw.details,
              courseId: raw.courseId,
              teacherId,
              organizationId,
              questions,
            },
          },
        })
        .subscribe({
          next: () => {
            this.isSaving.set(false);
            this.toast.showSuccess('Quiz actualizado correctamente');
            this.router.navigate(['/quizzes', this.id()]);
          },
          error: (err) => {
            this.isSaving.set(false);
            this.toast.showError(err.message || 'Error al actualizar el quiz');
          },
        });
    } else {
      this.apollo
        .mutate({
          mutation: CreateQuizDocument,
          variables: {
            createQuizInput: {
              title: raw.title,
              details: raw.details,
              courseId: raw.courseId,
              teacherId,
              organizationId,
              questions,
            },
          },
        })
        .subscribe({
          next: (res) => {
            this.isSaving.set(false);
            this.toast.showSuccess('Quiz creado correctamente');
            const id = res.data?.createQuiz?.id;
            if (id) {
              this.router.navigate(['/quizzes', id]);
            }
          },
          error: (err) => {
            this.isSaving.set(false);
            this.toast.showError(err.message || 'Error al crear el quiz');
          },
        });
    }
  }
}
