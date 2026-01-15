import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'lib-stat-card',
  template: `
    <div class="card border border-base-200 bg-base-100">
      <div class="card-body p-4">
        <p class="text-xs uppercase text-base-content/60">{{ label }}</p>
        <div class="text-2xl font-semibold text-base-content">{{ value }}</div>
        @if (helper) {
          <p class="text-xs text-base-content/70">{{ helper }}</p>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCard {
  @Input() label = '';
  @Input() value = '';
  @Input() helper?: string;
}
