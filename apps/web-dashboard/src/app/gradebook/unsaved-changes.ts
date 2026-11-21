import { Confirmation } from '#/ui';
import { computed, inject, Injectable, signal } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { of } from 'rxjs';

/**
 * Pages with unsaved gradebook cells register here, so leaving them asks first (FR-ASM-001.6).
 * Reloading or closing the tab is covered by the grid's `beforeunload` handler.
 */
@Injectable({ providedIn: 'root' })
export class UnsavedChanges {
  readonly #counts = signal<Record<string, number>>({});
  readonly count = computed(() => Object.values(this.#counts()).reduce((a, b) => a + b, 0));

  set(owner: string, count: number): void {
    this.#counts.update((counts) => ({ ...counts, [owner]: count }));
  }

  clear(owner: string): void {
    this.#counts.update((counts) => {
      const rest = { ...counts };
      delete rest[owner];
      return rest;
    });
  }
}

export const unsavedChangesGuard: CanDeactivateFn<unknown> = () => {
  const unsaved = inject(UnsavedChanges);
  const n = unsaved.count();
  if (!n) return of(true);
  return inject(Confirmation).confirm({
    title: 'Cambios sin guardar',
    message: `Tienes ${n === 1 ? '1 nota sin guardar' : `${n} notas sin guardar`}. Si sales ahora, se quedarán como borrador en este navegador.`,
    confirmText: 'Salir',
    cancelText: 'Seguir calificando',
    severity: 'warning',
  });
};
