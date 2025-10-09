import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';

@Component({
  selector: 'lib-paginator',
  template: ` <div class="flex justify-between items-center w-full bg-base-100">
    <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">
      Mostrando de {{ start() }} a {{ end() }} de {{ count() }}
    </p>
    <div>
      <div class="join">
        <button
          class="join-item btn"
          [class.btn-disabled]="!hasPreviousPage()"
          (click)="previousPage()"
        >
          «
        </button>
        @for(page of pagesRange(); track page) {
        <button
          class="join-item btn"
          [class.btn-active]="page === currentPage()"
          (click)="skip.set(page * take() - take())"
        >
          {{ page }}
        </button>
        }
        <button
          class="join-item btn"
          [class.btn-disabled]="!hasNextPage()"
          (click)="nextPage()"
        >
          »
        </button>
      </div>
    </div>
  </div>`,
  styles: `:host {
    width: 100%;
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Paginator {
  public take = model.required<number>();
  public skip = model.required<number>();
  public count = input.required<number>();

  public pages = computed(() => Math.ceil(this.count() / this.take()));
  public pagesRange = computed(() => {
    const pages = [];
    for (let i = 1; i <= this.pages(); i++) {
      pages.push(i);
    }
    return pages;
  });
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
