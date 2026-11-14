import { Component, input, output } from '@angular/core';
import { Button } from './button';

@Component({
  selector: 'lib-page-header',
  imports: [Button],
  template: `
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
      <div>
        <h1 class="text-2xl font-semibold text-base-content">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ subtitle() }}
          </p>
        }
      </div>
      @if (actionLabel()) {
        <button uiButton variant="primary" type="button" (click)="action.emit()">
          @if (actionIcon()) {
            <span class="material-symbols-outlined">{{ actionIcon() }}</span>
          }
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
})
export class PageHeader {
  title = input.required<string>();
  subtitle = input<string | undefined>('');
  actionLabel = input<string | undefined>();
  actionIcon = input<string | undefined>();
  action = output<void>();
}
