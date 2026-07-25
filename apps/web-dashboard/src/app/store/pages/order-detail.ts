import { SchoolContext } from '#/shared';
import { DatePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { StoreApiService } from '../store-api.service';

@Component({
  selector: 'app-order-detail',
  imports: [RouterLink, DatePipe],
  template: `
    <a [routerLink]="['..']" class="btn btn-ghost btn-sm mb-4">← Mis pedidos</a>
    @if (order.isLoading()) {
      <p>Cargando…</p>
    } @else if (!order.value()) {
      <div class="alert alert-error">Pedido no encontrado.</div>
    } @else {
      @let o = order.value()!;
      <div class="space-y-4">
        <h2 class="text-xl font-semibold">Pedido {{ o.id }}</h2>
        <p class="text-sm text-base-content/70">{{ o.createdAt | date: 'medium' }}</p>
        <div class="flex flex-wrap gap-2">
          <span class="badge badge-outline">Estado: {{ o.status }}</span>
          <span class="badge badge-outline">Pago: {{ o.paymentStatus }}</span>
        </div>
        <table class="table border border-base-200 rounded-box">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Talla</th>
              <th>Cant.</th>
              <th>P. unit.</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            @for (it of o.items; track it.id) {
              <tr>
                <td>{{ it.product?.name }}</td>
                <td>{{ it.variantLabel || '—' }}</td>
                <td>{{ it.quantity }}</td>
                <td>{{ formatPrice(it.unitPrice) }}</td>
                <td>{{ formatPrice(itemLineTotal(it)) }}</td>
              </tr>
            }
          </tbody>
        </table>
        <p class="text-lg font-bold">Total: {{ formatPrice(o.total) }}</p>
      </div>
    }
  `,
})
export default class OrderDetail {
  readonly id = input.required<string>();
  private readonly api = inject(StoreApiService);
  private readonly school = inject(SchoolContext);

  protected order = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.storeOrder(params.id).pipe(map((o) => o ?? null)),
  });

  protected formatPrice(price: unknown): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: this.school.currencyCode(),
    }).format(Number(price));
  }

  protected itemLineTotal(it: { quantity?: number | null; unitPrice?: unknown }): number {
    return Number(it.unitPrice ?? 0) * (it.quantity ?? 0);
  }
}
