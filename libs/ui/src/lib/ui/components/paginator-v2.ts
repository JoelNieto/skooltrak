import { afterRenderEffect, Component, computed, input, model } from '@angular/core';

/** Page number or ellipsis placeholder for compact pagination */
type PageItem = number | 'ellipsis';

@Component({
  selector: 'lib-paginator',
  template: `<div class="flex justify-between items-center w-full">
    <p class="text-sm text-base-content font-medium">
      Mostrando de <strong>{{ start() }}</strong> a <strong>{{ end() }}</strong> de <strong>{{ total() }}</strong>
    </p>
    <div>
      <div class="join join-horizontal">
        <button class="join-item btn btn-sm" [class.btn-disabled]="!hasPreviousPage()" (click)="previousPage()">
          ‹
        </button>
        @for (item of pageItems(); track trackPageItem($index, item)) {
          @if (item === 'ellipsis') {
            <span class="join-item btn btn-sm btn-disabled no-pointer-events px-2">…</span>
          } @else {
            <button class="join-item btn btn-sm min-w-9" [class.btn-active]="item === page()" (click)="page.set(item)">
              {{ item }}
            </button>
          }
        }
        <button class="join-item btn btn-sm" [class.btn-disabled]="!hasNextPage()" (click)="nextPage()">›</button>
      </div>
    </div>
  </div>`,
  styles: `
    :host {
      width: 100%;
    }
    :host .no-pointer-events {
      pointer-events: none;
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
