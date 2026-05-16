import { SchoolContext } from '@/shared';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { map, of } from 'rxjs';
import { StoreApiService } from '../store-api.service';

@Component({
  selector: 'app-orders-list',
  imports: [RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 class="text-xl font-semibold mb-4">Mis pedidos</h2>
    @if (!school.currentSchoolId()) {
      <div class="alert alert-warning">Selecciona una escuela.</div>
    } @else {
      <div class="overflow-x-auto rounded-box border border-base-200">
        <table class="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Pago</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (o of orders.value(); track o.id) {
              <tr>
                <td>{{ o.createdAt | date: 'short' }}</td>
                <td>{{ o.status }}</td>
                <td>{{ o.paymentStatus }}</td>
                <td>{{ formatPrice(o.total) }}</td>
                <td>
                  <a [routerLink]="[o.id]" class="link link-primary">Detalle</a>
                </td>
              </tr>
            } @empty {
              @if (orders.isLoading()) {
                <tr><td colspan="5">Cargando…</td></tr>
              } @else {
                <tr><td colspan="5" class="text-base-content/60">Sin pedidos aún.</td></tr>
              }
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export default class OrdersList {
  protected readonly school = inject(SchoolContext);
  private readonly api = inject(StoreApiService);

  protected orders = rxResource({
    params: () => ({ schoolId: this.school.currentSchoolId() }),
    stream: ({ params }) => {
      if (!params.schoolId) {
        return of([]);
      }
      return this.api
        .myStoreOrders(params.schoolId)
        .pipe(map((rows) => (Array.isArray(rows) ? rows : [])));
    },
  });

  protected formatPrice(price: unknown): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: this.school.currencyCode(),
    }).format(Number(price));
  }
}
