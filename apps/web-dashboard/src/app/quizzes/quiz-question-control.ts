import { TextEditor } from '#/ui';
import { Component, inject, input, ChangeDetectionStrategy } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import { $Enums } from '@generated/prisma';
import QuestionOptionControl from './question-option-control';

@Component({
  selector: 'app-quiz-question-control',
  imports: [TextEditor, ReactiveFormsModule, QuestionOptionControl],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<form [formGroup]="question()" class="flex flex-col gap-6">
    <div class="fieldset">
      <label for="question">Pregunta</label>
      <lib-text-editor
        id="question"
        name="question"
        formControlName="question"
      />
    </div>
    <div class="fieldset">
      <label for="description">Tipo de Pregunta</label>
      <select
        id="type"
        name="type"
        formControlName="type"
        class="select select-primary"
      >
        <option value="" disabled selected>Selecciona un tipo...</option>
        @for (type of questionTypes; track $index) {
        <option [value]="type.value">
          {{ type.label }}
        </option>
        }
      </select>
    </div>
    @if (question().value.type === TYPE_ENUM.QuizQuestionType.SINGLE_CHOICE || question().value.type === TYPE_ENUM.QuizQuestionType.MULTIPLE_CHOICE || question().value.type === TYPE_ENUM.QuizQuestionType.TRUE_FALSE) {
      <div class="flex flex-col gap-4 mt-2" formArrayName="options">
        @for (option of options.controls; track $index) {
          <div class="flex items-start gap-2 w-full">
            <app-question-option-control [option]="option" [index]="$index" class="flex-1 min-w-0" />
            <button type="button" class="btn btn-ghost btn-sm btn-square shrink-0 mt-8" (click)="removeOption($index)" title="Eliminar opción">
              <span class="material-symbols-outlined text-error">delete</span>
            </button>
          </div>
        }
        <button type="button" class="btn btn-soft btn-sm" (click)="addOption()">
          <span class="material-symbols-outlined">add</span>
          Agregar opción
        </button>
      </div>
    }
    @if (question().value.type === TYPE_ENUM.QuizQuestionType.TEXT) {
      <p class="text-sm text-base-content/60">El estudiante responderá con texto libre.</p>
    }
    <div class="fieldset">
      <label [for]="'value-' + index()">Puntos</label>
      <input
        type="number"
        [id]="'value-' + index()"
        formControlName="value"
        class="input input-primary"
        min="0"
        step="0.5"
      />
    </div>
    <div class="fieldset">
      <label [for]="'timeLimit-' + index()">Tiempo límite (segundos)</label>
      <input
        type="number"
        [id]="'timeLimit-' + index()"
        formControlName="timeLimit"
        class="input input-primary"
        min="0"
        placeholder="0 = sin límite"
      />
    </div>
  </form>`,
})
export class QuizQuestionControl {
  public question = input.required<
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
  >();
  public index = input.required<number>();
  public questionTypes = [
    { value: $Enums.QuizQuestionType.SINGLE_CHOICE, label: 'Elección Simple' },
    { value: $Enums.QuizQuestionType.TEXT, label: 'Texto' },
    {
      value: $Enums.QuizQuestionType.MULTIPLE_CHOICE,
      label: 'Elección Multiple',
    },
    { value: $Enums.QuizQuestionType.TRUE_FALSE, label: 'Verdadero o Falso' },
  ];
  TYPE_ENUM = $Enums;

  private fb = inject(NonNullableFormBuilder);

  public get options() {
    return this.question().controls.options;
  }

  addOption() {
    this.options.push(
      this.fb.group({
        option: this.fb.control(''),
        isCorrect: this.fb.control(false),
      }),
    );
  }

  removeOption(index: number) {
    this.options.removeAt(index);
  }
}
