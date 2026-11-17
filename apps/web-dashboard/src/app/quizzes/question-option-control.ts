import { TextEditor, UiCheckbox, UiChoice } from '#/ui';
import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-question-option-control',
  imports: [UiCheckbox, UiChoice, TextEditor, ReactiveFormsModule],
  template: `
    <div class="flex flex-col gap-2 w-full">
      <div class="fieldset">
        <label for="option">Opción {{ index() + 1 }}</label>
        <lib-text-editor
          id="option"
          name="option"
          formControlName="option"
          class="input input-primary"
          placeholder="Opción..."
        />
      </div>
      <ui-choice label="Correcta">
        <input uiCheckbox type="checkbox" formControlName="isCorrect" />
      </ui-choice>
    </div>
  `,
})
export default class QuestionOptionControl {
  public option = input.required<FormGroup>();
  public index = input.required<number>();
}
