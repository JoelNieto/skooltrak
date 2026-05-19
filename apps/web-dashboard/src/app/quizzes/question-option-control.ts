import { TextEditor } from '#/ui';
import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-question-option-control',
  imports: [TextEditor, ReactiveFormsModule],
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
      <div class="fieldset flex items-center gap-2">
        <input
          type="checkbox"
          id="isCorrect"
          formControlName="isCorrect"
          class="checkbox checkbox-primary"
        />
        <label for="isCorrect" class="cursor-pointer">Correcta</label>
      </div>
    </div>
  `,
})
export default class QuestionOptionControl {
  public option = input.required<FormGroup>();
  public index = input.required<number>();
}
