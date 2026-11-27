import { SchoolContext } from '#/shared';
import {
  Alert,
  Badge,
  BadgeTone,
  Button,
  Card,
  Chip,
  ChipCount,
  Confirmation,
  Icon,
  StatCard,
  Toast,
  UiInputGroup,
  UiRowAction,
  UiRowActions,
  UiSelect,
  UiTable,
  UiTableEmpty,
  UiTableError,
  UiTableSkeleton,
  UiTableToolbar,
  listState,
} from '#/ui';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { filter, map, of, switchMap } from 'rxjs';
import { StoreApiService } from '../store-api.service';
import { storeBaseSegments } from '../store-nav';
import {
  apiError,
  formatMoney,
  isSingleVariant,
  StockState,
  stockState,
  StoreCategory,
  StoreProduct,
} from '../store.types';

type StatusFilter = 'all' | 'active' | 'inactive' | 'out' | 'low';

const STOCK_BADGE: Record<StockState, { label: string; tone: BadgeTone } | null> = {
  out: { label: 'Agotado', tone: 'danger' },
  low: { label: 'Stock bajo', tone: 'warning' },
  partial: { label: 'Talla agotada', tone: 'warning' },
  ok: null,
};

/** Tienda › Productos: stock at a glance, filters, and quick actions per product. */
@Component({
  selector: 'app-products-admin',
  imports: [
    Alert,
    Badge,
    Button,
    Card,
    Chip,
    ChipCount,
    FormsModule,
    Icon,
    RouterLink,
    StatCard,
    UiInputGroup,
    UiRowActions,
    UiSelect,
    UiTable,
    UiTableEmpty,
    UiTableError,
    UiTableSkeleton,
    UiTableToolbar,
  ],
  template: `
    @if (!school.currentSchoolId()) {
      <div uiAlert tone="warning">Selecciona una escuela.</div>
    } @else {
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-6">
        <lib-stat-card label="Productos" icon="tag" [value]="'' + stats().total" [helper]="stats().active + ' visibles en la tienda'" />
        <lib-stat-card label="Unidades en stock" icon="layers" color="info" [value]="'' + stats().units" />
        <lib-stat-card label="Stock bajo" icon="triangle-alert" color="warning" [value]="'' + stats().low" helper="5 unidades o menos" />
        <lib-stat-card label="Agotados" icon="circle-x" color="error" [value]="'' + stats().out" />
      </div>

      <ui-table-toolbar label="Filtrar productos">
        <label uiInputGroup size="sm">
          <ui-icon name="search" class="text-base text-ink-subtle" />
          <input
            aria-label="Buscar productos"
            class="pl-0"
            type="search"
            placeholder="Buscar por nombre o talla…"
            [ngModel]="search()"
            (ngModelChange)="search.set($event)"
          />
        </label>
        <select
          uiSelect
          size="sm"
          class="w-48"
          aria-label="Categoría"
          [ngModel]="categoryId()"
          (ngModelChange)="categoryId.set($event)"
        >
          <option value="">Todas las categorías</option>
          @for (c of categories.value() ?? []; track c.id) {
            <option [value]="c.id">{{ c.name }}</option>
          }
        </select>
        <span uiToolbarEnd class="text-sm text-ink-muted">{{ visible().length }} de {{ stats().total }}</span>
        <div uiToolbarChips role="group" aria-label="Filtrar por estado" class="flex flex-wrap gap-2">
          @for (f of statusFilters(); track f.key) {
            <button uiChip [pressed]="status() === f.key" (click)="status.set(f.key)">
              {{ f.label }} <span uiChipCount>{{ f.count }}</span>
            </button>
          }
        </div>
      </ui-table-toolbar>

      <div uiCard class="overflow-x-auto mt-3">
        <table uiTable [attr.aria-busy]="products.isLoading()">
          <thead>
            <tr>
              <th>Producto</th>
              <th class="text-right">Precio</th>
              <th>Inventario</th>
              <th>Estado</th>
              <th class="w-12"><span class="sr-only">Acciones</span></th>
            </tr>
          </thead>
          @switch (productsList.phase()) {
            @case ('skeleton') {
              <tbody uiTableSkeleton [columns]="5"></tbody>
            }
            @case ('error') {
              <tbody>
                <tr uiTableError [columns]="5" (retry)="products.reload()"></tr>
              </tbody>
            }
            @case ('ready') {
              <tbody>
                @for (p of visible(); track p.id) {
                  <tr data-testid="store-product-row" [class.opacity-60]="!p.active">
                    <td>
                      <a [routerLink]="editLink(p.id)" class="flex min-w-0 items-center gap-3 group">
                        <span class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface-0 text-ink-subtle">
                          @if (p.imageUrl) {
                            <img [src]="p.imageUrl" alt="" class="h-full w-full object-cover" />
                          } @else {
                            <ui-icon name="image" class="text-xl" />
                          }
                        </span>
                        <span class="min-w-0">
                          <span class="block truncate font-semibold text-ink-strong group-hover:underline">{{ p.name }}</span>
                          <span class="block truncate text-xs text-ink-muted">{{ p.category?.name ?? 'Sin categoría' }}</span>
                        </span>
                      </a>
                    </td>
                    <td class="text-right font-semibold tabular-nums">{{ money(p.price) }}</td>
                    <td>
                      <div class="flex flex-col gap-1">
                        <span class="text-sm tabular-nums">
                          <span class="font-semibold text-ink-strong">{{ p.totalStock }}</span> unidades
                        </span>
                        @if (!isSingle(p)) {
                          <span class="flex flex-wrap gap-1">
                            @for (v of p.variants; track v.id) {
                              <span
                                class="rounded border px-1.5 py-0.5 text-xs tabular-nums"
                                [class.border-line]="v.stock > 0"
                                [class.text-ink-muted]="v.stock > 0"
                                [class.border-error]="v.stock <= 0"
                                [class.text-error]="v.stock <= 0"
                                [attr.title]="v.label + ': ' + v.stock"
                                >{{ v.label }} · {{ v.stock }}</span
                              >
                            }
                          </span>
                        }
                      </div>
                    </td>
                    <td>
                      <div class="flex flex-wrap gap-1">
                        @if (p.active) {
                          <span uiBadge size="sm" tone="success">Visible</span>
                        } @else {
                          <span uiBadge size="sm" tone="neutral">Oculto</span>
                        }
                        @if (stockBadge(p); as b) {
                          <span uiBadge size="sm" [tone]="b.tone">{{ b.label }}</span>
                        }
                      </div>
                    </td>
                    <td class="text-right">
                      <ui-row-actions
                        [actions]="rowActions(p)"
                        [label]="'Acciones para ' + p.name"
                        (action)="onRowAction($event, p)"
                      />
                    </td>
                  </tr>
                } @empty {
                  @if (stats().total === 0) {
                    <tr
                      uiTableEmpty
                      [columns]="5"
                      icon="store"
                      title="Tu tienda aún no tiene productos"
                      description="Agrega uniformes, libros o útiles. Puedes crear las categorías mientras lo haces."
                    >
                      <a uiButton variant="primary" size="sm" [routerLink]="newLink()">
                        <ui-icon name="plus" /> Crear el primer producto
                      </a>
                    </tr>
                  } @else {
                    <tr uiTableEmpty [columns]="5" icon="search-x" title="Ningún producto coincide con los filtros">
                      <button uiButton size="sm" type="button" (click)="clearFilters()">Limpiar filtros</button>
                    </tr>
                  }
                }
              </tbody>
            }
          }
        </table>
      </div>
    }
  `,
})
export default class ProductsAdmin {
  protected readonly school = inject(SchoolContext);
  private readonly api = inject(StoreApiService);
  private readonly toast = inject(Toast);
  private readonly confirmation = inject(Confirmation);
  private readonly listTick = signal(0);

  protected readonly search = signal('');
  protected readonly categoryId = signal('');
  protected readonly status = signal<StatusFilter>('all');

  protected products = rxResource({
    params: () => ({ schoolId: this.school.currentSchoolId(), tick: this.listTick() }),
    stream: ({ params }) => {
      if (!params.schoolId) return of([] as StoreProduct[]);
      return this.api
        .storeProductsAdmin(params.schoolId)
        .pipe(map((rows) => (Array.isArray(rows) ? (rows as StoreProduct[]) : [])));
    },
  });

  protected categories = rxResource({
    params: () => ({ schoolId: this.school.currentSchoolId() }),
    stream: ({ params }) => {
      if (!params.schoolId) return of([] as StoreCategory[]);
      return this.api
        .storeCategoriesAdmin(params.schoolId)
        .pipe(map((rows) => (Array.isArray(rows) ? (rows as StoreCategory[]) : [])));
    },
  });

  /** products with smooth loading: previous rows stay while the list reloads. */
  protected readonly productsList = listState(this.products);

  private readonly all = computed(() => this.productsList.rows() ?? []);

  protected readonly stats = computed(() => {
    const rows = this.all();
    return {
      total: rows.length,
      active: rows.filter((p) => p.active).length,
      units: rows.reduce((n, p) => n + (p.totalStock ?? 0), 0),
      low: rows.filter((p) => stockState(p) === 'low').length,
      out: rows.filter((p) => stockState(p) === 'out').length,
    };
  });

  protected readonly statusFilters = computed(() => {
    const rows = this.all();
    const s = this.stats();
    return [
      { key: 'all' as const, label: 'Todos', count: s.total },
      { key: 'active' as const, label: 'Visibles', count: s.active },
      { key: 'inactive' as const, label: 'Ocultos', count: rows.length - s.active },
      { key: 'low' as const, label: 'Stock bajo', count: s.low },
      { key: 'out' as const, label: 'Agotados', count: s.out },
    ];
  });

  protected readonly visible = computed(() => {
    const q = this.search().trim().toLocaleLowerCase('es');
    const cat = this.categoryId();
    const status = this.status();
    return this.all().filter((p) => {
      if (cat && p.categoryId !== cat) return false;
      if (status === 'active' && !p.active) return false;
      if (status === 'inactive' && p.active) return false;
      if (status === 'low' && stockState(p) !== 'low') return false;
      if (status === 'out' && stockState(p) !== 'out') return false;
      if (!q) return true;
      return (
        p.name.toLocaleLowerCase('es').includes(q) ||
        p.variants.some((v) => v.label.toLocaleLowerCase('es').includes(q))
      );
    });
  });

  protected isSingle(p: StoreProduct) {
    return isSingleVariant(p.variants);
  }

  protected stockBadge(p: StoreProduct) {
    return STOCK_BADGE[stockState(p)];
  }

  protected money(value: unknown) {
    return formatMoney(value, this.school.currencyCode());
  }

  protected newLink() {
    return [...storeBaseSegments(this.school), 'admin', 'products', 'new'];
  }

  protected editLink(id: string) {
    return [...storeBaseSegments(this.school), 'admin', 'products', id, 'edit'];
  }

  protected clearFilters() {
    this.search.set('');
    this.categoryId.set('');
    this.status.set('all');
  }

  /** The actions in each row's menu (ui-row-actions). */
  protected rowActions(p: StoreProduct): UiRowAction[] {
    return [
      { id: 'edit', label: 'Editar', icon: 'pencil', link: this.editLink(p.id) },
      p.active
        ? { id: 'hide', label: 'Ocultar de la tienda', icon: 'eye-off' }
        : { id: 'show', label: 'Mostrar en la tienda', icon: 'eye' },
      { id: 'delete', label: 'Eliminar', icon: 'trash-2', tone: 'danger' },
    ];
  }

  protected onRowAction(action: string, p: StoreProduct): void {
    if (action === 'hide' || action === 'show') this.setActive(p, action === 'show');
    if (action === 'delete') this.remove(p);
  }

  private setActive(p: StoreProduct, active: boolean) {
    this.api.updateStoreProduct({ id: p.id, active }).subscribe({
      next: () => {
        this.toast.showSuccess(active ? 'Producto visible en la tienda' : 'Producto oculto');
        this.listTick.update((n) => n + 1);
      },
      error: (e) => this.toast.showError(apiError(e, 'No se pudo actualizar el producto')),
    });
  }

  private remove(p: StoreProduct) {
    const ordered = (p._count?.orderItems ?? 0) > 0;
    this.confirmation
      .confirm({
        title: ordered ? 'Este producto tiene pedidos' : `¿Eliminar "${p.name}"?`,
        message: ordered
          ? 'Para conservar el historial de pedidos no se borra: se ocultará de la tienda y saldrá de los carritos.'
          : 'Se borrará el producto con todas sus tallas. Esta acción no se puede deshacer.',
        confirmText: ordered ? 'Ocultar producto' : 'Eliminar',
        severity: ordered ? 'warning' : 'error',
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.api.deleteStoreProduct(p.id)),
      )
      .subscribe({
        next: (res) => {
          this.toast.showSuccess(res?.archived ? 'Producto ocultado' : 'Producto eliminado');
          this.listTick.update((n) => n + 1);
        },
        error: (e) => this.toast.showError(apiError(e, 'No se pudo eliminar el producto')),
      });
  }
}
