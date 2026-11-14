import { Component, computed, input } from '@angular/core';
import { Card, CardBody } from './card';

type StatCardColor = 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' | 'neutral';

@Component({
  selector: 'lib-stat-card',
  imports: [Card, CardBody],
  template: `
    <div uiCard>
      <div uiCardBody class="p-4">
        <div class="flex items-center justify-between">
          <p class="text-xs uppercase text-base-content/50 font-medium tracking-wider">{{ label() }}</p>
          @if (icon()) {
            <span class="material-symbols-outlined text-lg" [class]="iconColorClass()">{{ icon() }}</span>
          }
        </div>
        <div class="text-2xl font-semibold text-base-content mt-1">{{ value() }}</div>
        @if (helper()) {
          <p class="text-xs text-base-content/50 mt-1">{{ helper() }}</p>
        }
      </div>
    </div>
  `,
})
export class StatCard {
  label = input('');
  value = input('');
  helper = input<string>();
  icon = input<string>();
  color = input<StatCardColor>('primary');

  iconColorClass = computed(() => {
    const colorMap: Record<StatCardColor, string> = {
      primary: 'text-primary',
      secondary: 'text-secondary',
      accent: 'text-accent',
      info: 'text-info',
      success: 'text-success',
      warning: 'text-warning',
      error: 'text-error',
      neutral: 'text-base-content/60',
    };
    return colorMap[this.color()];
  });
}
