import {
  EnvironmentInjector,
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';

const GLOBAL_KEY = '__SK_ROOT_ENVIRONMENT_INJECTOR__';

type GlobalWithInjector = typeof globalThis & {
  [GLOBAL_KEY]?: EnvironmentInjector;
};

/**
 * Captures the root `EnvironmentInjector` on `globalThis` during app bootstrap.
 *
 * Required for `rxResource` / `effect` in `providedIn: 'root'` services that may
 * be first injected from narrow injectors (e.g. route guards in native-federation
 * remotes), where the local `EnvironmentInjector` lacks providers like
 * `ChangeDetectionScheduler`. Using `globalThis` keeps a single reference even
 * when the `client-auth` library is bundled into multiple federation chunks.
 */
export function provideRootEnvironmentInjector(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideEnvironmentInitializer(() => {
      const root = inject(EnvironmentInjector);
      (globalThis as GlobalWithInjector)[GLOBAL_KEY] = root;
    }),
  ]);
}

/** Returns the root `EnvironmentInjector` captured by `provideRootEnvironmentInjector`. */
export function injectResourceInjector(): EnvironmentInjector {
  const stored = (globalThis as GlobalWithInjector)[GLOBAL_KEY];
  if (stored) {
    return stored;
  }
  return inject(EnvironmentInjector);
}
