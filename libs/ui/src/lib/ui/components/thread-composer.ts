import { Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'lib-thread-composer',
  template: `
    <form class="flex items-end gap-2 border-t border-base-300 p-2 bg-base-100" (submit)="onSubmit($event)">
      <textarea
        class="textarea textarea-primary flex-1 resize-none"
        rows="1"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [value]="draft()"
        (input)="onInput($event)"
      ></textarea>
      <button class="btn btn-primary" type="submit" [disabled]="disabled() || !draft().trim()">
        <span class="material-symbols-outlined">send</span>
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
