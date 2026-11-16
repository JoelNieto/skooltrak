import { Component, computed, input, output } from '@angular/core';
import { Button } from './button';

type EmptyStateColor = 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'neutral';

@Component({
  selector: 'lib-empty-state',
  imports: [Button],
  template: `
    <div class="border border-dashed rounded-lg p-6 text-center" [class]="containerClass()">
      @if (icon()) {
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3" [class]="iconBgClass()">
          <span class="material-symbols-outlined text-2xl" [class]="iconColorClass()">{{ icon() }}</span>
        </div>
      }
      <p class="type-label text-ink-strong">{{ title() }}</p>
      @if (description()) {
        <p class="text-sm mt-1.5 text-ink-muted max-w-xs mx-auto">{{ description() }}</p>
      }
      @if (actionLabel()) {
        <button
          uiButton
          size="sm"
          type="button"
          class="mt-4"
          [variant]="color() === 'neutral' ? 'ghost' : 'secondary'"
          (click)="onAction()"
        >
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
})
export class EmptyState {
  title = input('');
  description = input<string>();
  icon = input<string>();
  color = input<EmptyStateColor>('primary');
  actionLabel = input<string>();
  action = output<void>();

  containerClass = computed(() => {
    const colorMap: Record<EmptyStateColor, string> = {
      primary: 'border-primary/30 bg-action-subtle',
      secondary: 'border-secondary/30 bg-secondary/5',
      accent: 'border-accent/30 bg-accent/5',
      info: 'border-info/30 bg-info/5',
      success: 'border-success/30 bg-success/5',
      warning: 'border-warning/30 bg-warning/5',
      neutral: 'border-line-strong bg-surface-2/50',
    };
    return colorMap[this.color()];
  });

  iconBgClass = computed(() => {
    const colorMap: Record<EmptyStateColor, string> = {
      primary: 'bg-action-subtle',
      secondary: 'bg-secondary/10',
      accent: 'bg-accent/10',
      info: 'bg-info/10',
      success: 'bg-success/10',
      warning: 'bg-warning/10',
      neutral: 'bg-surface-2',
    };
    return colorMap[this.color()];
  });

  iconColorClass = computed(() => {
    const colorMap: Record<EmptyStateColor, string> = {
      primary: 'text-primary',
      secondary: 'text-secondary',
      accent: 'text-accent',
      info: 'text-info',
      success: 'text-success',
      warning: 'text-warning',
      neutral: 'text-ink-muted',
    };
    return colorMap[this.color()];
  });

  onAction() {
    this.action.emit();
  }
}
