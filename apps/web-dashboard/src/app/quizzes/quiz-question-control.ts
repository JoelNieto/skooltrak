import { Button, TextEditor, UiField, UiInput, UiSelect } from '#/ui';
import { Component, inject, input } from '@angular/core';
import { FormArray, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { $Enums } from '@generated/prisma';
import QuestionOptionControl from './question-option-control';

@Component({
  selector: 'app-quiz-question-control',
  imports: [UiField, UiInput, UiSelect, Button, TextEditor, ReactiveFormsModule, QuestionOptionControl],
  template: `<form [formGroup]="question()" class="flex flex-col gap-6">
    <div class="fieldset">
      <label for="question">Pregunta</label>
      <lib-text-editor id="question" name="question" formControlName="question" />
    </div>
    <ui-field label="Tipo de Pregunta">
      <select uiSelect id="type" name="type" formControlName="type">
        <option value="" disabled selected>Selecciona un tipo...</option>
        @for (type of questionTypes; track $index) {
          <option [value]="type.value">
            {{ type.label }}
          </option>
        }
      </select>
    </ui-field>
    @if (
      question().value.type === TYPE_ENUM.QuizQuestionType.SINGLE_CHOICE ||
      question().value.type === TYPE_ENUM.QuizQuestionType.MULTIPLE_CHOICE ||
      question().value.type === TYPE_ENUM.QuizQuestionType.TRUE_FALSE
    ) {
      <div class="flex flex-col gap-4 mt-2" formArrayName="options">
        @for (option of options.controls; track $index) {
          <div class="flex items-start gap-2 w-full">
            <app-question-option-control [option]="option" [index]="$index" class="flex-1 min-w-0" />
            <button
              uiButton
              variant="ghost"
              size="sm"
              iconOnly
              type="button"
              class="shrink-0 mt-8"
              (click)="removeOption($index)"
              title="Eliminar opción"
            >
              <span class="material-symbols-outlined text-error">delete</span>
            </button>
          </div>
        }
        <button uiButton size="sm" type="button" (click)="addOption()">
          <span class="material-symbols-outlined">add</span>
          Agregar opción
        </button>
      </div>
    }
    @if (question().value.type === TYPE_ENUM.QuizQuestionType.TEXT) {
      <p class="text-sm text-base-content/60">El estudiante responderá con texto libre.</p>
    }
    <ui-field label="Puntos">
      <input uiInput type="number" [id]="'value-' + index()" formControlName="value" min="0" step="0.5" />
    </ui-field>
    <ui-field label="Tiempo límite (segundos)">
      <input
        uiInput
        type="number"
        [id]="'timeLimit-' + index()"
        formControlName="timeLimit"
        min="0"
        placeholder="0 = sin límite"
      />
    </ui-field>
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
