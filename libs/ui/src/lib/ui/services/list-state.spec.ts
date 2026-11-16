import { computed, Resource, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { listState } from './list-state';

/** The parts of a Resource that listState reads, driven by hand. */
function fakeResource<T>() {
  const value = signal<T | undefined>(undefined);
  const loading = signal(true);
  const error = signal<Error | undefined>(undefined);
  const resource = {
    value,
    isLoading: loading.asReadonly(),
    error: error.asReadonly(),
    hasValue: computed(() => value() !== undefined),
  } as unknown as Resource<T>;
  return {
    resource,
    /** Data arrives. */
    resolve: (v: T) => {
      value.set(v);
      loading.set(false);
    },
    /** A new request (page, sort, search): Angular drops the value while it loads. */
    request: () => {
      value.set(undefined);
      loading.set(true);
    },
    fail: (e: Error) => {
      value.set(undefined);
      loading.set(false);
      error.set(e);
    },
  };
}

function setup() {
  const fake = fakeResource<string[]>();
  const state = TestBed.runInInjectionContext(() => listState(fake.resource));
  const tick = (ms = 0) => {
    vi.advanceTimersByTime(ms);
    TestBed.tick();
  };
  TestBed.tick();
  return { fake, state, tick };
}

describe('listState', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('never shows the skeleton for a fast response', () => {
    const { fake, state, tick } = setup();
    expect(state.phase()).toBe('pending');
    tick(150);
    fake.resolve(['Matemáticas']);
    tick();
    expect(state.phase()).toBe('ready');
    tick(500);
    expect(state.phase()).toBe('ready');
    expect(state.rows()).toEqual(['Matemáticas']);
  });

  it('shows the skeleton after the delay and keeps it for the minimum time', () => {
    const { fake, state, tick } = setup();
    tick(200);
    expect(state.phase()).toBe('skeleton');
    tick(100); // 300ms: data arrives, 100ms into the skeleton
    fake.resolve(['Matemáticas']);
    tick();
    expect(state.phase()).toBe('skeleton');
    tick(250); // 550ms: still inside the 400ms minimum
    expect(state.phase()).toBe('skeleton');
    tick(60); // 610ms: minimum over
    expect(state.phase()).toBe('ready');
    expect(state.rows()).toEqual(['Matemáticas']);
  });

  it('keeps the previous rows while a new request loads, and reports it as refreshing', () => {
    const { fake, state, tick } = setup();
    fake.resolve(['Matemáticas']);
    tick();
    fake.request();
    tick(1000);
    expect(state.phase()).toBe('ready');
    expect(state.rows()).toEqual(['Matemáticas']);
    expect(state.refreshing()).toBe(true);
    fake.resolve(['Ciencias']);
    tick();
    expect(state.rows()).toEqual(['Ciencias']);
    expect(state.refreshing()).toBe(false);
  });

  it('reports errors ahead of everything else', () => {
    const { fake, state, tick } = setup();
    tick(250);
    fake.fail(new Error('500'));
    tick();
    expect(state.phase()).toBe('error');
  });
});
