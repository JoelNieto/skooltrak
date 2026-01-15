import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

@Component({
  selector: 'lib-page-header',
  template: `
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4"
    >
      <div>
        <h1 class="text-2xl font-semibold text-base-content">{{ title }}</h1>
        @if (subtitle) {
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ subtitle }}
          </p>
        }
      </div>
      @if (actionLabel) {
        <button class="btn btn-neutral" type="button" (click)="action.emit()">
          @if (actionIcon) {
            <span class="material-symbols-outlined">{{ actionIcon }}</span>
          }
          {{ actionLabel }}
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeader {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() actionLabel?: string;
  @Input() actionIcon?: string;
  @Output() action = new EventEmitter<void>();
}
