import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'lib-empty-state',
  template: `
    <div
      class="border border-dashed border-base-300 rounded-lg p-6 text-center text-base-content/70"
    >
      @if (icon) {
        <span class="material-symbols-outlined text-3xl mb-2">{{ icon }}</span>
      }
      <p class="font-medium text-base-content">{{ title }}</p>
      @if (description) {
        <p class="text-sm mt-1">{{ description }}</p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  @Input() title = '';
  @Input() description?: string;
  @Input() icon?: string;
}
