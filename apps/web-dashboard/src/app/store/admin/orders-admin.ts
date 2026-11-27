import { SchoolContext } from '#/shared';
import {
  Alert,
  Badge,
  Card,
  Chip,
  ChipCount,
  Toast,
  UiSelect,
  UiTable,
  UiTableEmpty,
  UiTableError,
  UiTableSkeleton,
  listState,
} from '#/ui';
import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { map, of } from 'rxjs';
import { StoreApiService } from '../store-api.service';
import {
  apiError,
  formatMoney,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
  StoreOrder,
  StoreOrderStatus,
} from '../store.types';

const STATUSES = Object.keys(ORDER_STATUS_LABEL) as StoreOrderStatus[];
/** Orders that still need someone at the school to act. */
const OPEN: readonly StoreOrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY'];

/** Tienda › Pedidos: who bought what, payment state, and moving each order along. */
@Component({
  selector: 'app-orders-admin',
  imports: [Alert, Badge, Card, Chip, ChipCount, DatePipe, UiSelect, UiTable, UiTableEmpty, UiTableError, UiTableSkeleton],
  template: `
    @if (!school.currentSchoolId()) {
      <div uiAlert tone="warning">Selecciona una escuela.</div>
    } @else {
      <div class="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h2 class="type-heading-md text-ink-strong">Pedidos</h2>
          <p class="text-sm text-ink-muted">Cambia el estado a medida que preparas y entregas cada pedido.</p>
        </div>
      </div>
      <div role="group" aria-label="Filtrar pedidos" class="flex flex-wrap gap-2 mb-3">
        @for (f of filters(); track f.key) {
          <button uiChip [pressed]="view() === f.key" (click)="view.set(f.key)">
            {{ f.label }} <span uiChipCount>{{ f.count }}</span>
          </button>
        }
      </div>
      <div uiCard class="overflow-x-auto">
        <table uiTable [attr.aria-busy]="orders.isLoading()">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Comprador</th>
              <th>Artículos</th>
              <th class="text-right">Total</th>
              <th>Pago</th>
              <th>Estado</th>
            </tr>
          </thead>
          @switch (ordersList.phase()) {
            @case ('skeleton') {
              <tbody uiTableSkeleton [columns]="6"></tbody>
            }
            @case ('error') {
              <tbody>
                <tr uiTableError [columns]="6" (retry)="orders.reload()"></tr>
              </tbody>
            }
            @case ('ready') {
              <tbody>
                @for (o of visible(); track o.id) {
                  <tr>
                    <td>
                      <span class="block font-mono text-xs text-ink-strong">#{{ o.id.slice(-8).toUpperCase() }}</span>
                      <span class="block text-xs text-ink-muted">{{ o.createdAt | date: 'd MMM y, HH:mm' }}</span>
                    </td>
                    <td>
                      @if (o.user) {
                        <span class="block font-medium text-ink-strong">{{ o.user.firstName }} {{ o.user.lastName }}</span>
                        <span class="block text-xs text-ink-muted">{{ o.user.email }}</span>
                      } @else {
                        —
                      }
                    </td>
                    <td class="text-sm">
                      @for (it of o.items; track it.id) {
                        <span class="block">
                          {{ it.quantity }} × {{ it.product?.name ?? 'Producto' }}
                          @if (it.variantLabel && it.variantLabel !== 'Única') {
                            <span class="text-ink-muted">({{ it.variantLabel }})</span>
                          }
                        </span>
                      }
                      @if (o.notes) {
                        <span class="block text-xs text-ink-muted italic">“{{ o.notes }}”</span>
                      }
                    </td>
                    <td class="text-right font-semibold tabular-nums">{{ money(o.total) }}</td>
                    <td>
                      <span uiBadge size="sm" [tone]="paymentTone[o.paymentStatus]">{{ paymentLabel[o.paymentStatus] }}</span>
                    </td>
                    <td>
                      <div class="flex flex-col gap-1">
                        <span uiBadge size="sm" class="self-start" [tone]="statusTone[o.status]">{{ statusLabel[o.status] }}</span>
                        <select
                          uiSelect
                          size="sm"
                          class="w-44"
                          [attr.aria-label]="'Cambiar estado del pedido ' + o.id.slice(-8).toUpperCase()"
                          [value]="o.status"
                          (change)="updateStatus(o, $any($event.target).value)"
                        >
                          @for (s of statuses; track s) {
                            <option [value]="s" [selected]="s === o.status">{{ statusLabel[s] }}</option>
                          }
                        </select>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr
                    uiTableEmpty
                    [columns]="6"
                    icon="receipt"
                    [title]="view() === 'open' ? 'No hay pedidos por atender' : 'Aún no hay pedidos'"
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
export default class OrdersAdmin {
  protected readonly school = inject(SchoolContext);
  private readonly api = inject(StoreApiService);
  private readonly toast = inject(Toast);
  private readonly tick = signal(0);

  protected readonly statuses = STATUSES;
  protected readonly statusLabel = ORDER_STATUS_LABEL;
  protected readonly statusTone = ORDER_STATUS_TONE;
  protected readonly paymentLabel = PAYMENT_STATUS_LABEL;
  protected readonly paymentTone = PAYMENT_STATUS_TONE;
  protected readonly view = signal<'open' | 'done' | 'all'>('open');

  protected orders = rxResource({
    params: () => ({ schoolId: this.school.currentSchoolId(), t: this.tick() }),
    stream: ({ params }) => {
      if (!params.schoolId) return of([] as StoreOrder[]);
      return this.api
        .storeOrdersAdmin(params.schoolId)
        .pipe(map((rows) => (Array.isArray(rows) ? (rows as StoreOrder[]) : [])));
    },
  });

  /** orders with smooth loading: previous rows stay while the list reloads after a status change. */
  protected readonly ordersList = listState(this.orders);
  private readonly all = computed(() => this.ordersList.rows() ?? []);

  protected readonly filters = computed(() => {
    const rows = this.all();
    const open = rows.filter((o) => OPEN.includes(o.status)).length;
    return [
      { key: 'open' as const, label: 'Por atender', count: open },
      { key: 'done' as const, label: 'Cerrados', count: rows.length - open },
      { key: 'all' as const, label: 'Todos', count: rows.length },
    ];
  });

  protected readonly visible = computed(() => {
    const v = this.view();
    if (v === 'all') return this.all();
    return this.all().filter((o) => OPEN.includes(o.status) === (v === 'open'));
  });

  protected money(value: unknown) {
    return formatMoney(value, this.school.currencyCode());
  }

  protected updateStatus(o: StoreOrder, status: StoreOrderStatus) {
    if (status === o.status) return;
    this.api.updateStoreOrderStatus({ orderId: o.id, status }).subscribe({
      next: () => {
        this.toast.showSuccess(`Pedido marcado como "${ORDER_STATUS_LABEL[status]}"`);
        this.tick.update((n) => n + 1);
      },
      error: (e) => this.toast.showError(apiError(e, 'No se pudo cambiar el estado')),
    });
  }
}
