import { TextEditor } from '@/ui';
import { Component, inject } from '@angular/core';
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
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorPlusCircleDuotone,
  phosphorTrashDuotone,
} from '@ng-icons/phosphor-icons/duotone';
import { $Enums, Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import Store from '../core/store';
import { QuizQuestionControl } from './quiz-question-control';

@Component({
  selector: 'app-quiz-form',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    TextEditor,
    QuizQuestionControl,
    NgIcon,
  ],
  viewProviders: [
    provideIcons({ phosphorTrashDuotone, phosphorPlusCircleDuotone }),
  ],
  template: `<div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li><a routerLink="/quizzes">Quizes</a></li>
        <li>Nuevo quiz</li>
      </ul>
    </div>
    <h1 class="text-2xl font-semibold mb-2">Nuevo quiz</h1>
    <form [formGroup]="quizForm">
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
                <option value="" disabled selected>
                  Selecciona un curso...
                </option>
                @for(course of coursesResource.value(); track course.id) {
                <option value="{{ course.id }}">{{ course.name }}</option>
                }
              </select>
            </div>
            <div class="fieldset">
              <label for="description">Descripción</label>
              <lib-text-editor
                id="description"
                name="description"
                formControlName="description"
              />
            </div>
          </div>
          <div class="flex justify-end mt-4">
            <button
              type="submit"
              class="btn btn-primary"
              (click)="saveChanges()"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
      <div class="card bg-base-100 card-border border-neutral-300 my-4">
        <div class="card-body">
          <h2 class="card-title text-xl font-semibold">Preguntas</h2>

          <div formArrayName="questions" class="flex flex-col gap-4">
            @for(question of questions.controls; track $index) {
            <div class="card bg-base-100 card-border border-neutral-300">
              <div class="card-body">
                <div class="flex justify-between">
                  <h2 class="card-title">Pregunta {{ $index + 1 }}</h2>
                  <button
                    class="btn btn-soft btn-error"
                    (click)="removeQuestion($index)"
                  >
                    <ng-icon name="phosphorTrashDuotone" />
                  </button>
                </div>
                <app-quiz-question-control
                  [question]="question"
                  [index]="$index"
                />
              </div>
            </div>
            }
            <button class="btn btn-primary btn-soft" (click)="addQuestion()">
              <ng-icon name="phosphorPlusCircleDuotone" />
              Agregar pregunta
            </button>
          </div>
        </div>
      </div>
    </form>`,
})
export default class QuizForm {
  private fb = inject(NonNullableFormBuilder);
  private store = inject(Store);
  private apollo = inject(Apollo);

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

  private createQuestionGroup(
    question?: Prisma.QuizQuestionGetPayload<{ include: { options: true } }>
  ) {
    return this.fb.group<{
      question: FormControl<string>;
      value: FormControl<number | Prisma.Decimal>;
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
      value: this.fb.control((question?.value as number | Prisma.Decimal) ?? 0),
      type: this.fb.control((question?.type as $Enums.QuizQuestionType) ?? ''),
      timeLimit: this.fb.control((question?.timeLimit as number) ?? 0),
      options: this.fb.array<
        FormGroup<{
          option: FormControl<string>;
          isCorrect: FormControl<boolean>;
        }>
      >(
        question?.options
          ? question.options.map((opt) => this.createOptionGroup(opt))
          : []
      ),
    });
  }

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
        .watchQuery<{
          coursesBySchoolId: Prisma.CourseGetPayload<{
            include: undefined;
          }>[];
        }>({
          query: gql`
            query CoursesBySchoolId($schoolId: String!) {
              coursesBySchoolId(schoolId: $schoolId) {
                id
                name
              }
            }
          `,
          variables: {
            schoolId: params.schoolId,
          },
        })
        .valueChanges.pipe(map((result) => result.data.coursesBySchoolId));
    },
  });

  public quizForm = this.fb.group({
    title: this.fb.control('', [Validators.required]),
    description: this.fb.control('', [Validators.required]),
    courseId: this.fb.control('', [Validators.required]),
    questions: this.fb.array<
      FormGroup<{
        question: FormControl<string>;
        value: FormControl<number | Prisma.Decimal>;
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

  initQuestion(
    question?: Prisma.QuizQuestionGetPayload<{ include: { options: true } }>
  ) {
    return this.createQuestionGroup(question);
  }

  addQuestion() {
    this.questions.push(this.createQuestionGroup());
  }

  removeQuestion(index: number) {
    this.questions.removeAt(index);
  }

  saveChanges() {
    console.log(this.quizForm.getRawValue());
  }
}
