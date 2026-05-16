import { Toast } from '@/ui';
import { SchoolContext } from '@/shared';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { map, of } from 'rxjs';
import { StoreApiService } from '../store-api.service';

@Component({
  selector: 'app-orders-admin',
  imports: [FormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h3 class="text-lg font-medium mb-4">Pedidos (escuela)</h3>
    @if (!school.currentSchoolId()) {
      <div class="alert alert-warning">Selecciona una escuela.</div>
    } @else {
      <div class="overflow-x-auto rounded-box border border-base-200">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Pago</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (o of orders.value(); track o.id) {
              <tr>
                <td class="font-mono text-xs">{{ o.id!.slice(0, 8) }}…</td>
                <td>{{ o.createdAt | date: 'short' }}</td>
                <td>{{ o.userId!.slice(0, 8) }}…</td>
                <td>{{ formatPrice(o.total) }}</td>
                <td>{{ o.status }}</td>
                <td>{{ o.paymentStatus }}</td>
                <td>
                  <select
                    class="select select-bordered select-xs"
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
              @if (orders.isLoading()) {
                <tr><td colspan="7">Cargando…</td></tr>
              } @else {
                <tr><td colspan="7">Sin pedidos.</td></tr>
              }
            }
          </tbody>
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
      return this.api
        .storeOrdersAdmin(params.schoolId)
        .pipe(map((rows) => (Array.isArray(rows) ? rows : [])));
    },
  });

  protected formatPrice(price: unknown): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: this.school.currencyCode(),
    }).format(Number(price));
  }

  protected updateStatus(orderId: string, status: string) {
    this.api
      .updateStoreOrderStatus({ orderId, status })
      .subscribe({
        next: () => {
          this.toast.showSuccess('Estado actualizado');
          this.tick.update((n) => n + 1);
        },
        error: (e: Error) => this.toast.showError(e.message),
      });
  }
}
