import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';

/** Page number or ellipsis placeholder for compact pagination */
export type PageItem = number | 'ellipsis';

@Component({
  selector: 'lib-paginator',
  template: ` <div class="flex justify-between items-center w-full">
    <p class="text-sm text-base-content font-medium">
      Mostrando de <strong>{{ start() }}</strong> a
      <strong>{{ end() }}</strong> de <strong>{{ count() }}</strong>
    </p>
    <div>
      <div class="join join-horizontal">
        <button
          class="join-item btn btn-sm"
          [class.btn-disabled]="!hasPreviousPage()"
          (click)="previousPage()"
        >
          ‹
        </button>
        @for(item of pageItems(); track trackPageItem($index, item)) {
          @if(item === 'ellipsis') {
            <span class="join-item btn btn-sm btn-disabled no-pointer-events px-2">…</span>
          } @else {
            <button
              class="join-item btn btn-sm min-w-9"
              [class.btn-active]="item === currentPage()"
              (click)="skip.set((item - 1) * take())"
            >
              {{ item }}
            </button>
          }
        }
        <button
          class="join-item btn btn-sm"
          [class.btn-disabled]="!hasNextPage()"
          (click)="nextPage()"
        >
          ›
        </button>
      </div>
    </div>
  </div>`,
  styles: `:host {
    width: 100%;
  }
  :host .no-pointer-events {
    pointer-events: none;
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Paginator {
  public take = model.required<number>();
  public skip = model.required<number>();
  public count = input.required<number>();

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
  public currentPage = computed(
    () => Math.floor(this.skip() / this.take()) + 1
  );

  public start = computed(() => this.skip() + 1);
  public end = computed(() =>
    this.skip() + this.take() > this.count()
      ? this.count()
      : this.skip() + this.take()
  );

  public hasPreviousPage = computed(() => this.currentPage() > 1);
  public hasNextPage = computed(() => this.currentPage() < this.pages());

  public previousPage() {
    this.skip.update((skip) => skip - this.take());
  }

  public nextPage() {
    this.skip.update((skip) => skip + this.take());
  }
}
