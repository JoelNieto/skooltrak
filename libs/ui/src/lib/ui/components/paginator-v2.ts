import { afterRenderEffect, Component, computed, input, model } from '@angular/core';
import { Button } from './button';

/** Page number or ellipsis placeholder for compact pagination */
type PageItem = number | 'ellipsis';

@Component({
  selector: 'lib-paginator',
  imports: [Button],
  template: `<div class="flex justify-between items-center w-full">
    <p class="text-sm text-ink-strong font-medium">
      Mostrando de <strong>{{ start() }}</strong> a <strong>{{ end() }}</strong> de <strong>{{ total() }}</strong>
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
              [variant]="item === page() ? 'primary' : 'ghost'"
              [attr.aria-current]="item === page() ? 'page' : null"
              (click)="page.set(item)"
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
export class PaginatorV2 {
  public page = model.required<number>();
  public pageSize = model.required<number>();
  public total = input<number>(0);

  public pages = computed(() => Math.ceil(this.total() / this.pageSize()));

  /** Compact page items: numbers and ellipsis for large page counts */
  public pageItems = computed((): PageItem[] => {
    const pages = this.pages();
    const current = this.page();
    const windowSize = 2;

    if (pages <= 9) {
      return Array.from({ length: pages }, (_, i) => i + 1);
    }

    const items: PageItem[] = [1];
    const windowStart = Math.max(2, current - windowSize);
    const windowEnd = Math.min(pages - 1, current + windowSize);

    if (windowStart > 2) items.push('ellipsis');
    for (let i = windowStart; i <= windowEnd; i++) items.push(i);
    if (windowEnd < pages - 1) items.push('ellipsis');
    if (pages > 1) items.push(pages);

    return items;
  });

  constructor() {
    afterRenderEffect(() => {
      if (this.page() > this.pages() && this.pages() > 0) {
        this.page.set(this.pages());
      }
    });
  }

  trackPageItem = (index: number, item: PageItem) => (item === 'ellipsis' ? `ellipsis-${index}` : `page-${item}`);

  private skip = computed(() => (this.page() - 1) * this.pageSize());
  public start = computed(() => this.skip() + 1);
  public end = computed(() =>
    this.skip() + this.pageSize() > this.total() ? this.total() : this.skip() + this.pageSize(),
  );

  public hasPreviousPage = computed(() => this.page() > 1);
  public hasNextPage = computed(() => this.page() < this.pages());

  public previousPage() {
    this.page.update((current) => current - 1);
    console.log(this.page());
  }

  public nextPage() {
    this.page.update((current) => current + 1);
  }
}
