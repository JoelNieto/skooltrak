import {
  Breadcrumbs,
  Button,
  Card,
  CardBody,
  CardTitle,
  Loader,
  TextEditor,
  Toast,
  UiField,
  UiInput,
  UiSelect,
} from '#/ui';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { $Enums } from '@generated/prisma';

import { HttpClient, httpResource } from '@angular/common/http';
import Store from '../core/store';
import { isValidId } from '../core/validators';
import { QuizQuestionControl } from './quiz-question-control';

@Component({
  selector: 'app-quiz-form',
  imports: [
    Breadcrumbs,
    Card,
    CardBody,
    CardTitle,
    UiField,
    UiInput,
    UiSelect,
    Button,
    ReactiveFormsModule,
    FormsModule,
    TextEditor,
    QuizQuestionControl,
    Loader,
  ],
  template: `
    <ui-breadcrumbs
      [items]="[
        { label: 'Inicio', link: '/' },
        { label: 'Quizes', link: '/quizzes' },
        { label: isEditMode() ? 'Editar' : 'Nuevo quiz' },
      ]"
    />
    <h1 class="text-2xl font-semibold mb-2">{{ isEditMode() ? 'Editar quiz' : 'Nuevo quiz' }}</h1>

    @if (isEditMode() && quizResource.isLoading()) {
      <lib-loader />
    } @else {
      <form [formGroup]="quizForm" (ngSubmit)="saveChanges()">
        <div uiCard>
          <div uiCardBody>
            <h2 uiCardTitle>Datos del quiz</h2>
            <div class="flex flex-col gap-4">
              <ui-field label="Titulo">
                <input
                  uiInput
                  type="text"
                  id="title"
                  name="title"
                  formControlName="title"
                  placeholder="Titulo del quiz..."
                />
              </ui-field>
              <ui-field label="Curso">
                <select
                  uiSelect
                  id="courseId"
                  name="courseId"
                  formControlName="courseId"
                  placeholder="Selecciona un curso..."
                >
                  <option value="" disabled selected>Selecciona un curso...</option>
                  @for (course of coursesResource.value(); track course.id) {
                    <option [value]="course.id">{{ course.name }}</option>
                  }
                </select>
              </ui-field>
              <div class="fieldset">
                <label for="details">Descripción</label>
                <lib-text-editor id="details" name="details" formControlName="details" [bordered]="true" />
              </div>
            </div>
            <div class="flex justify-end mt-4">
              <button uiButton [loading]="isSaving()" variant="primary" type="submit" [disabled]="isSaving()">
                Guardar
              </button>
            </div>
          </div>
        </div>
        <div uiCard class="my-4">
          <div uiCardBody>
            <h2 uiCardTitle class="text-xl font-semibold">Preguntas</h2>

            <div formArrayName="questions" class="flex flex-col gap-4">
              @for (question of questions.controls; track $index) {
                <div uiCard>
                  <div uiCardBody>
                    <div class="flex justify-between">
                      <h2 uiCardTitle>Pregunta {{ $index + 1 }}</h2>
                      <button uiButton variant="danger" type="button" (click)="removeQuestion($index)">
                        <span class="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                    <app-quiz-question-control [question]="question" [index]="$index" />
                  </div>
                </div>
              }
              <button uiButton type="button" (click)="addQuestion()">
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
  private http = inject(HttpClient);
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

  public quizResource = httpResource<{
    id: string;
    title: string;
    details: string;
    courseId: string;
    course?: { id: string };
    questions: Array<{
      id: string;
      question: string;
      value: unknown;
      type: string;
      timeLimit?: number | null;
      options?: Array<{ id: string; option: string; isCorrect: boolean }>;
    }>;
  } | null>(() => {
    if (!this.id() || !isValidId(this.id())) return undefined;
    return `/api/v1/quizzes/${this.id()}`;
  });

  public coursesResource = httpResource<{ id: string; name: string }[]>(() => {
    const schoolId = this.store.currentSchoolId();
    if (!schoolId) return undefined;
    return {
      url: `/api/v1/courses/by-school/${schoolId}`,
    };
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
          courseId: quiz.course?.id ?? quiz.courseId,
        });
        this.questions.clear();
        for (const q of quiz.questions) {
          this.questions.push(
            this.createQuestionGroup({
              question: q.question,
              value: Number(q.value),
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
      this.http
        .patch<{ id: string }>(`/api/v1/quizzes`, {
          id: this.id()!,
          title: raw.title,
          details: raw.details,
          courseId: raw.courseId,
          teacherId,
          organizationId,
          questions,
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
      this.http
        .post<{ id: string }>(`/api/v1/quizzes`, {
          title: raw.title,
          details: raw.details,
          courseId: raw.courseId,
          teacherId,
          organizationId,
          questions,
        })
        .subscribe({
          next: (res) => {
            this.isSaving.set(false);
            this.toast.showSuccess('Quiz creado correctamente');
            const id = res.id;
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
