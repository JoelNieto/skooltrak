import { computed, effect, Injectable, signal, Signal } from '@angular/core';
import { debounceSignal } from './util';

type PaginationState = {
  take: number;
  skip: number;
  count: number;
  search: string;
  sortBy: string | null;
  sortOrder: 'asc' | 'desc';
};

@Injectable()
export class Pagination {
  #search = signal('');
  #debouncedSearch: Signal<string>;
  #state = signal<PaginationState>({
    take: 10,
    skip: 0,
    count: 0,
    search: '',
    sortBy: null,
    sortOrder: 'asc',
  });

  public take = computed(() => this.#state().take);
  public skip = computed(() => this.#state().skip);
  public count = computed(() => this.#state().count);
  public sortBy = computed(() => this.#state().sortBy);
  public sortOrder = computed(() => this.#state().sortOrder);

  public search = computed(() => this.#state().search);

  public setOrder(column: string) {
    this.#state.update((current) => ({
      ...current,
      sortBy: column,
      sortOrder:
        current.sortBy === column
          ? current.sortOrder === 'asc'
            ? 'desc'
            : 'asc'
          : 'asc',
    }));
  }

  public updateSkip(skip: number) {
    this.#state.update((current) => ({ ...current, skip }));
  }

  public updateTake(take: number) {
    this.#state.update((current) => ({ ...current, take }));
  }

  public updateCount(count: number) {
    this.#state.update((current) => ({ ...current, count }));
  }

  constructor() {
    // Debounce search input by 300ms
    this.#debouncedSearch = debounceSignal(this.#search, 300);

    // Update the state when debounced search changes
    effect(() => {
      this.#state.update((current) => ({
        ...current,
        search: this.#debouncedSearch(),
      }));
    });
  }

  public updateSearch(search: string) {
    this.#search.set(search);
  }
}
