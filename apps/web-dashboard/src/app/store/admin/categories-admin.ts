import { SchoolContext } from '#/shared';
import {
  Alert,
  Badge,
  Button,
  Card,
  Confirmation,
  Icon,
  Toast,
  UiInput,
  UiTable,
  UiTableEmpty,
  UiTableError,
  UiTableSkeleton,
  UiToggle,
  listState,
} from '#/ui';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { filter, map, of, switchMap } from 'rxjs';
import { StoreApiService } from '../store-api.service';
import { apiError, StoreCategory } from '../store.types';

type Draft = { name: string; active: boolean };

/**
 * Tienda › Categorías: how the catalogue groups products. Rows edit in place and save on their
 * own; the arrows set the order families see the category chips in.
 */
@Component({
  selector: 'app-categories-admin',
  imports: [Alert, Badge, Button, Card, Icon, UiInput, UiTable, UiTableEmpty, UiTableError, UiTableSkeleton, UiToggle],
  template: `
    @if (!school.currentSchoolId()) {
      <div uiAlert tone="warning">Selecciona una escuela.</div>
    } @else {
      <div class="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h2 class="type-heading-md text-ink-strong">Categorías</h2>
          <p class="text-sm text-ink-muted">Agrupan los productos en la tienda: uniformes, libros, útiles…</p>
        </div>
        <form class="flex flex-wrap gap-2" (submit)="create($event)">
          <input
            uiInput
            size="sm"
            class="w-56"
            aria-label="Nombre de la nueva categoría"
            placeholder="Nueva categoría"
            [value]="newName()"
            (input)="newName.set($any($event.target).value)"
          />
          <button uiButton variant="primary" size="sm" type="submit" [disabled]="!newName().trim() || creating()">
            <ui-icon name="plus" /> Agregar
          </button>
        </form>
      </div>
      <div uiCard class="overflow-x-auto">
        <table uiTable [attr.aria-busy]="categories.isLoading()">
          <thead>
            <tr>
              <th class="w-20">Orden</th>
              <th>Nombre</th>
              <th class="text-right">Productos</th>
              <th>Visible</th>
              <th><span class="sr-only">Acciones</span></th>
            </tr>
          </thead>
          @switch (categoriesList.phase()) {
            @case ('skeleton') {
              <tbody uiTableSkeleton [columns]="5"></tbody>
            }
            @case ('error') {
              <tbody>
                <tr uiTableError [columns]="5" (retry)="categories.reload()"></tr>
              </tbody>
            }
            @case ('ready') {
              <tbody>
                @for (c of rows(); track c.id; let first = $first, last = $last, i = $index) {
                  <tr>
                    <td>
                      <div class="flex gap-0.5">
                        <button uiButton variant="ghost" size="sm" iconOnly type="button" [disabled]="first" [attr.aria-label]="'Subir ' + c.name" (click)="move(i, -1)">
                          <ui-icon name="arrow-up" />
                        </button>
                        <button uiButton variant="ghost" size="sm" iconOnly type="button" [disabled]="last" [attr.aria-label]="'Bajar ' + c.name" (click)="move(i, 1)">
                          <ui-icon name="arrow-down" />
                        </button>
                      </div>
                    </td>
                    <td>
                      <input
                        uiInput
                        size="sm"
                        class="max-w-72"
                        [attr.aria-label]="'Nombre de ' + c.name"
                        [value]="draft(c).name"
                        (input)="edit(c, { name: $any($event.target).value })"
                        (keydown.enter)="save(c)"
                      />
                    </td>
                    <td class="text-right tabular-nums">{{ c._count?.products ?? 0 }}</td>
                    <td>
                      <input
                        uiToggle
                        size="sm"
                        type="checkbox"
                        [attr.aria-label]="'Visible: ' + c.name"
                        [checked]="draft(c).active"
                        (change)="edit(c, { active: $any($event.target).checked }); save(c)"
                      />
                    </td>
                    <td>
                      <div class="flex justify-end gap-2">
                        @if (dirty(c)) {
                          <span uiBadge size="sm" tone="warning" class="self-center">Sin guardar</span>
                          <button uiButton size="sm" variant="primary" type="button" (click)="save(c)">Guardar</button>
                        }
                        <button uiButton variant="ghost" size="sm" iconOnly type="button" class="text-error" [attr.aria-label]="'Eliminar ' + c.name" (click)="remove(c)">
                          <ui-icon name="trash-2" />
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr
                    uiTableEmpty
                    [columns]="5"
                    icon="layers"
                    title="Aún no hay categorías"
                    description="Agrega la primera con el campo de arriba, o créala al crear un producto."
                  ></tr>
                }
              </tbody>
            }
          }
        </table>
      </div>
    }
  `,
})
export default class CategoriesAdmin {
  protected readonly school = inject(SchoolContext);
  private readonly api = inject(StoreApiService);
  private readonly toast = inject(Toast);
  private readonly confirmation = inject(Confirmation);
  private readonly tick = signal(0);

  protected readonly newName = signal('');
  protected readonly creating = signal(false);
  /** Unsaved edits per category id. */
  private readonly drafts = signal<Record<string, Draft>>({});

  protected categories = rxResource({
    params: () => ({ schoolId: this.school.currentSchoolId(), t: this.tick() }),
    stream: ({ params }) => {
      if (!params.schoolId) return of([] as StoreCategory[]);
      return this.api
        .storeCategoriesAdmin(params.schoolId)
        .pipe(map((rows) => (Array.isArray(rows) ? (rows as StoreCategory[]) : [])));
    },
  });

  /** categories with smooth loading: rows stay while the list reloads after a change. */
  protected readonly categoriesList = listState(this.categories);
  protected readonly rows = computed(() => this.categoriesList.rows() ?? []);

  protected draft(c: StoreCategory): Draft {
    return this.drafts()[c.id] ?? { name: c.name, active: c.active };
  }

  protected dirty(c: StoreCategory) {
    const d = this.drafts()[c.id];
    return !!d && (d.name.trim() !== c.name || d.active !== c.active);
  }

  protected edit(c: StoreCategory, patch: Partial<Draft>) {
    this.drafts.update((all) => ({ ...all, [c.id]: { ...this.draft(c), ...patch } }));
  }

  private reload(clear?: string) {
    if (clear) {
      this.drafts.update((all) => {
        const next = { ...all };
        delete next[clear];
        return next;
      });
    }
    this.tick.update((n) => n + 1);
  }

  protected create(event: Event) {
    event.preventDefault();
    const schoolId = this.school.currentSchoolId();
    const name = this.newName().trim();
    if (!schoolId || !name) return;
    this.creating.set(true);
    this.api.createStoreCategory({ schoolId, name, sortOrder: this.rows().length }).subscribe({
      next: () => {
        this.newName.set('');
        this.creating.set(false);
        this.toast.showSuccess('Categoría creada');
        this.reload();
      },
      error: (e) => {
        this.creating.set(false);
        this.toast.showError(apiError(e, 'No se pudo crear la categoría'));
      },
    });
  }

  protected save(c: StoreCategory) {
    if (!this.dirty(c)) return;
    const d = this.draft(c);
    if (!d.name.trim()) {
      this.toast.showError('El nombre no puede quedar vacío');
      return;
    }
    this.api.updateStoreCategory({ id: c.id, name: d.name.trim(), active: d.active }).subscribe({
      next: () => {
        this.toast.showSuccess('Categoría guardada');
        this.reload(c.id);
      },
      error: (e) => this.toast.showError(apiError(e, 'No se pudo guardar la categoría')),
    });
  }

  /** Swaps with the neighbour and saves every row's position, so the order is always 0..n-1. */
  protected move(index: number, delta: -1 | 1) {
    const list = [...this.rows()];
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    const changed = list.map((c, i) => ({ c, i })).filter(({ c, i }) => c.sortOrder !== i);
    let pending = changed.length;
    for (const { c, i } of changed) {
      this.api.updateStoreCategory({ id: c.id, sortOrder: i }).subscribe({
        next: () => {
          if (--pending === 0) this.reload();
        },
        error: (e) => this.toast.showError(apiError(e, 'No se pudo cambiar el orden')),
      });
    }
  }

  protected remove(c: StoreCategory) {
    const count = c._count?.products ?? 0;
    this.confirmation
      .confirm({
        title: `¿Eliminar "${c.name}"?`,
        message: count
          ? `Sus ${count} productos no se borran: quedan sin categoría.`
          : 'La categoría no tiene productos.',
        confirmText: 'Eliminar',
        severity: 'error',
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.api.deleteStoreCategory(c.id)),
      )
      .subscribe({
        next: () => {
          this.toast.showSuccess('Categoría eliminada');
          this.reload(c.id);
        },
        error: (e) => this.toast.showError(apiError(e, 'No se pudo eliminar la categoría')),
      });
  }
}
