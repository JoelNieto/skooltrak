import { isPlatformServer } from '@angular/common';
import {
  computed,
  effect,
  inject,
  linkedSignal,
  PLATFORM_ID,
  Resource,
  Signal,
  signal,
  untracked,
} from '@angular/core';

/**
 * What a list or table should show:
 *   pending   first load, before the skeleton's delay: show nothing yet (no "empty" message)
 *   skeleton  first load that is taking a while
 *   error     the request failed
 *   ready     rows (or the empty state when there are none)
 */
export type ListPhase = 'pending' | 'skeleton' | 'error' | 'ready';

export interface ListState<T> {
  /** The latest rows; while a new request loads (next page, sort, search) the previous rows stay. */
  rows: Signal<T | undefined>;
  phase: Signal<ListPhase>;
  /** Loading with rows already on screen: dim them (the table does it through aria-busy). */
  refreshing: Signal<boolean>;
}

export interface ListStateOptions {
  /** Don't show the skeleton for responses faster than this (ms). */
  delay?: number;
  /** Once shown, keep the skeleton at least this long (ms), so it never flickers. */
  minDuration?: number;
}

/**
 * Smooth loading for a list fed by a resource (httpResource, resource, rxResource). Angular drops
 * a resource's value whenever its request changes, so a table bound to it straight away blanks
 * and shows its skeleton on every page, sort and search. This keeps the previous rows instead,
 * shows the skeleton only on the first load, only if it takes longer than `delay`, and for at
 * least `minDuration`:
 *
 *   subjects = httpResource<Page<Subject>>(() => …);
 *   subjectsList = listState(this.subjects);   // in an injection context, after the resource
 *
 *   <table uiTable [attr.aria-busy]="subjects.isLoading()">
 *     <thead>…</thead>
 *     @switch (subjectsList.phase()) {
 *       @case ('skeleton') { <tbody uiTableSkeleton [columns]="4"></tbody> }
 *       @case ('error') { <tbody><tr uiTableError [columns]="4" (retry)="subjects.reload()"></tr></tbody> }
 *       @case ('ready') { <tbody> @for (s of subjectsList.rows()?.data; track s.id) {…} @empty {…} </tbody> }
 *     }
 *   </table>
 */
export function listState<T>(resource: Resource<T>, options: ListStateOptions = {}): ListState<T> {
  const delay = options.delay ?? 200;
  const minDuration = options.minDuration ?? 400;
  const server = isPlatformServer(inject(PLATFORM_ID));

  const rows = linkedSignal<T | undefined, T | undefined>({
    source: () => (resource.hasValue() ? resource.value() : undefined),
    computation: (value, previous) => (value !== undefined ? value : previous?.value),
  });
  // Read rows() first, every time: linkedSignal only remembers values it was read at, and the
  // effect below must see each arrival for the next request to fall back on it.
  const firstLoad = computed(() => {
    const current = rows();
    return resource.isLoading() && current === undefined;
  });

  const skeleton = signal(false);
  let shownAt = 0;
  if (server) {
    // The server render waits for the data; timers would only hold it up.
    effect(() => skeleton.set(firstLoad()));
  } else {
    effect((onCleanup) => {
      const loading = firstLoad();
      const showing = untracked(skeleton);
      let timer: ReturnType<typeof setTimeout> | undefined;
      if (loading && !showing) {
        timer = setTimeout(() => {
          shownAt = Date.now();
          skeleton.set(true);
        }, delay);
      } else if (!loading && showing) {
        timer = setTimeout(() => skeleton.set(false), Math.max(0, minDuration - (Date.now() - shownAt)));
      }
      onCleanup(() => clearTimeout(timer));
    });
  }

  const phase = computed<ListPhase>(() => {
    if (resource.error()) return 'error';
    if (skeleton()) return 'skeleton';
    if (rows() === undefined && resource.isLoading()) return 'pending';
    return 'ready';
  });

  return {
    rows: rows.asReadonly(),
    phase,
    refreshing: computed(() => resource.isLoading() && rows() !== undefined),
  };
}
