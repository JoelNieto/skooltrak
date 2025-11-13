import { TextEditor } from '@/ui';
import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-question-option-control',
  imports: [TextEditor, ReactiveFormsModule],
  template: `<div class="fieldset">
    <label for="option">Opción {{ index() + 1 }}</label>
    <lib-text-editor
      id="option"
      name="option"
      formControlName="option"
      class="input input-primary"
      placeholder="Opción..."
    />
  </div> `,
})
export default class QuestionOptionControl {
  public option = input.required<FormGroup>();
  public index = input.required<number>();
}
