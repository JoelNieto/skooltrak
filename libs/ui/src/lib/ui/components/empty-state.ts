import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

type EmptyStateColor = 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'neutral';

@Component({
  selector: 'lib-empty-state',
  template: `
    <div class="border border-dashed rounded-lg p-6 text-center" [class]="containerClass()">
      @if (icon()) {
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3" [class]="iconBgClass()">
          <span class="material-symbols-outlined text-2xl" [class]="iconColorClass()">{{ icon() }}</span>
        </div>
      }
      <p class="font-medium text-sm text-base-content">{{ title() }}</p>
      @if (description()) {
        <p class="text-xs mt-1.5 text-base-content/60 max-w-xs mx-auto">{{ description() }}</p>
      }
      @if (actionLabel()) {
        <button class="btn btn-sm mt-4" [class]="buttonClass()" (click)="onAction()">
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
      primary: 'border-primary/30 bg-primary/5',
      secondary: 'border-secondary/30 bg-secondary/5',
      accent: 'border-accent/30 bg-accent/5',
      info: 'border-info/30 bg-info/5',
      success: 'border-success/30 bg-success/5',
      warning: 'border-warning/30 bg-warning/5',
      neutral: 'border-base-300 bg-base-200/50',
    };
    return colorMap[this.color()];
  });

  iconBgClass = computed(() => {
    const colorMap: Record<EmptyStateColor, string> = {
      primary: 'bg-primary/10',
      secondary: 'bg-secondary/10',
      accent: 'bg-accent/10',
      info: 'bg-info/10',
      success: 'bg-success/10',
      warning: 'bg-warning/10',
      neutral: 'bg-base-300',
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
      neutral: 'text-base-content/60',
    };
    return colorMap[this.color()];
  });

  buttonClass = computed(() => {
    const colorMap: Record<EmptyStateColor, string> = {
      primary: 'btn-primary btn-soft',
      secondary: 'btn-secondary btn-soft',
      accent: 'btn-accent btn-soft',
      info: 'btn-info btn-soft',
      success: 'btn-success btn-soft',
      warning: 'btn-warning btn-soft',
      neutral: 'btn-ghost',
    };
    return colorMap[this.color()];
  });

  onAction() {
    this.action.emit();
  }
}
