import { TextEditor } from '@/ui';
import { Component, input } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { $Enums, Prisma } from '@prisma/client';
import QuestionOptionControl from './question-option-control';

@Component({
  selector: 'app-quiz-question-control',
  imports: [TextEditor, ReactiveFormsModule, QuestionOptionControl],
  template: `<form [formGroup]="question()">
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
    @if(question().value.type === TYPE_ENUM.QuizQuestionType.SINGLE_CHOICE) {
    <div class="flex flex-col gap-2" formArrayName="options">
      @for (option of options.controls; track $index) {
      <app-question-option-control [option]="option" [index]="$index" />
      }
    </div>
    } @if(question().value.type === TYPE_ENUM.QuizQuestionType.MULTIPLE_CHOICE)
    { MULTIPLE } @if(question().value.type ===
    TYPE_ENUM.QuizQuestionType.TRUE_FALSE) { TRUE_FALSE }
    @if(question().value.type === TYPE_ENUM.QuizQuestionType.TEXT) { TEXT }
  </form>`,
})
export class QuizQuestionControl {
  public question = input.required<
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

  public get options() {
    return this.question().controls.options;
  }
}
