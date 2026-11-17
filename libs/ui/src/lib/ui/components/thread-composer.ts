import { Component, input, output, signal } from '@angular/core';
import { Button } from './button';
import { UiInput } from './field';
import { Icon } from './icon';

@Component({
  selector: 'lib-thread-composer',
  imports: [UiInput, Button, Icon],
  template: `
    <form class="flex items-end gap-2 border-t border-line p-2 bg-surface-1" (submit)="onSubmit($event)">
      <textarea
        uiInput
        class="flex-1 resize-none"
        rows="1"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [value]="draft()"
        (input)="onInput($event)"
      ></textarea>
      <button uiButton variant="primary" type="submit" [disabled]="disabled() || !draft().trim()">
        <ui-icon name="send" />
      </button>
    </form>
  `,
})
export class ThreadComposer {
  placeholder = input<string>('Escribe un mensaje…');
  disabled = input<boolean>(false);

  draft = signal('');
  send = output<string>();

  onInput(event: Event) {
    const target = event.target as HTMLTextAreaElement | null;
    this.draft.set(target?.value ?? '');
  }

  onSubmit(event: Event) {
    event.preventDefault();
    const value = this.draft().trim();
    if (!value) return;
    this.send.emit(value);
    this.draft.set('');
  }
}
