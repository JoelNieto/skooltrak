import { TextEditor, UiCheckbox, UiChoice, UiField } from '#/ui';
import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-question-option-control',
  imports: [UiCheckbox, UiChoice, TextEditor, ReactiveFormsModule, UiField],
  template: `
    <div class="flex flex-col gap-2 w-full">
      <ui-field label="Opción {{ index() + 1 }}">
        <lib-text-editor id="option" name="option" formControlName="option" [bordered]="true" placeholder="Opción..." />
      </ui-field>
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
