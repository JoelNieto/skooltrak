import { SchoolContext } from '#/shared';
import { Alert, Card, Toast, UiSelect, UiTable, UiTableEmpty, UiTableError, UiTableSkeleton, listState } from '#/ui';
import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { map, of } from 'rxjs';
import { StoreApiService } from '../store-api.service';

@Component({
  selector: 'app-orders-admin',
  imports: [Alert, Card, UiTable, UiTableEmpty, UiTableError, UiTableSkeleton, UiSelect, FormsModule, DatePipe],
  template: `
    <h3 class="text-lg font-medium mb-4">Pedidos (escuela)</h3>
    @if (!school.currentSchoolId()) {
      <div uiAlert tone="warning">Selecciona una escuela.</div>
    } @else {
      <div uiCard class="overflow-x-auto">
        <table uiTable density="compact" [attr.aria-busy]="orders.isLoading()">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Pago</th>
              <th><span class="sr-only">Cambiar estado</span></th>
            </tr>
          </thead>
          @switch (ordersList.phase()) {
            @case ('skeleton') {
              <tbody uiTableSkeleton [columns]="7"></tbody>
            }
            @case ('error') {
              <tbody>
                <tr uiTableError [columns]="7" (retry)="orders.reload()"></tr>
              </tbody>
            }
            @case ('ready') {
              <tbody>
                @for (o of ordersList.rows() ?? []; track o.id) {
                  <tr>
                    <td class="font-mono text-xs">{{ o.id!.slice(0, 8) }}…</td>
                    <td>{{ o.createdAt | date: 'short' }}</td>
                    <td>{{ o.userId!.slice(0, 8) }}…</td>
                    <td>{{ formatPrice(o.total) }}</td>
                    <td>{{ o.status }}</td>
                    <td>{{ o.paymentStatus }}</td>
                    <td>
                      <select
                        uiSelect
                        size="xs"
                        [attr.aria-label]="'Estado del pedido ' + o.id!.slice(0, 8)"
                        [ngModel]="o.status"
                        (ngModelChange)="updateStatus(o.id!, $event)"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="READY">READY</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                  </tr>
                } @empty {
                  <tr uiTableEmpty [columns]="7" icon="receipt" title="Aún no hay pedidos"></tr>
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

  protected orders = rxResource({
    params: () => ({ schoolId: this.school.currentSchoolId(), t: this.tick() }),
    stream: ({ params }) => {
      if (!params.schoolId) return of([]);
      return this.api.storeOrdersAdmin(params.schoolId).pipe(map((rows) => (Array.isArray(rows) ? rows : [])));
    },
  });

  /** orders with smooth loading: previous rows stay while the list reloads after a status change. */
  protected readonly ordersList = listState(this.orders);

  protected formatPrice(price: unknown): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: this.school.currencyCode(),
    }).format(Number(price));
  }

  protected updateStatus(orderId: string, status: string) {
    this.api.updateStoreOrderStatus({ orderId, status }).subscribe({
      next: () => {
        this.toast.showSuccess('Estado actualizado');
        this.tick.update((n) => n + 1);
      },
      error: (e: Error) => this.toast.showError(e.message),
    });
  }
}
