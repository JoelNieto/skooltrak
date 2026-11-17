import { Component, computed, input, model } from '@angular/core';
import { Button } from './button';

/** Page number or ellipsis placeholder for compact pagination */
export type PageItem = number | 'ellipsis';

@Component({
  selector: 'lib-paginator',
  imports: [Button],
  template: ` <div class="flex justify-between items-center w-full">
    <p class="text-sm text-ink-strong font-medium">
      Mostrando de <strong>{{ start() }}</strong> a <strong>{{ end() }}</strong> de <strong>{{ count() }}</strong>
    </p>
    <div>
      <nav class="flex items-center gap-1" aria-label="Paginación">
        <button
          uiButton
          variant="ghost"
          size="sm"
          iconOnly
          type="button"
          aria-label="Página anterior"
          [disabled]="!hasPreviousPage()"
          (click)="previousPage()"
        >
          ‹
        </button>
        @for (item of pageItems(); track trackPageItem($index, item)) {
          @if (item === 'ellipsis') {
            <span class="px-1 text-sm text-ink-subtle" aria-hidden="true">…</span>
          } @else {
            <button
              uiButton
              size="sm"
              iconOnly
              type="button"
              [variant]="item === currentPage() ? 'primary' : 'ghost'"
              [attr.aria-current]="item === currentPage() ? 'page' : null"
              (click)="skip.set((item - 1) * take())"
            >
              {{ item }}
            </button>
          }
        }
        <button
          uiButton
          variant="ghost"
          size="sm"
          iconOnly
          type="button"
          aria-label="Página siguiente"
          [disabled]="!hasNextPage()"
          (click)="nextPage()"
        >
          ›
        </button>
      </nav>
    </div>
  </div>`,
  styles: `
    :host {
      width: 100%;
    }
  `,
})
export class Paginator {
  public take = model.required<number>();
  public skip = model.required<number>();
  public count = input<number>(0);

  public pages = computed(() => Math.ceil(this.count() / this.take()));

  /** Compact page items: numbers and ellipsis for large page counts */
  public pageItems = computed((): PageItem[] => {
    const total = this.pages();
    const current = this.currentPage();
    const windowSize = 2;

    if (total <= 9) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const items: PageItem[] = [1];
    const windowStart = Math.max(2, current - windowSize);
    const windowEnd = Math.min(total - 1, current + windowSize);

    if (windowStart > 2) items.push('ellipsis');
    for (let i = windowStart; i <= windowEnd; i++) items.push(i);
    if (windowEnd < total - 1) items.push('ellipsis');
    if (total > 1) items.push(total);

    return items;
  });

  trackPageItem(index: number, item: PageItem): string {
    return item === 'ellipsis' ? `ellipsis-${index}` : `page-${item}`;
  }
  public currentPage = computed(() => Math.floor(this.skip() / this.take()) + 1);

  public start = computed(() => this.skip() + 1);
  public end = computed(() => (this.skip() + this.take() > this.count() ? this.count() : this.skip() + this.take()));

  public hasPreviousPage = computed(() => this.currentPage() > 1);
  public hasNextPage = computed(() => this.currentPage() < this.pages());

  public previousPage() {
    this.skip.update((skip) => skip - this.take());
  }

  public nextPage() {
    this.skip.update((skip) => skip + this.take());
  }
}
