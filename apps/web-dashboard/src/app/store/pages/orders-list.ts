import { SchoolContext } from '#/shared';
import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map, of } from 'rxjs';
import { StoreApiService } from '../store-api.service';
import { Alert, Card, UiTable, UiTableEmpty, UiTableError, UiTableSkeleton, listState } from '#/ui';

@Component({
  selector: 'app-orders-list',
  imports: [Alert, Card, UiTable, UiTableEmpty, UiTableError, UiTableSkeleton, RouterLink, DatePipe],
  template: `
    <h2 class="text-xl font-semibold mb-4">Mis pedidos</h2>
    @if (!school.currentSchoolId()) {
      <div uiAlert tone="warning">Selecciona una escuela.</div>
    } @else {
      <div uiCard class="overflow-x-auto">
        <table uiTable [attr.aria-busy]="orders.isLoading()">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Pago</th>
              <th>Total</th>
              <th><span class="sr-only">Detalle</span></th>
            </tr>
          </thead>
          @switch (ordersList.phase()) {
            @case ('skeleton') {
              <tbody uiTableSkeleton [columns]="5"></tbody>
            }
            @case ('error') {
              <tbody>
                <tr uiTableError [columns]="5" (retry)="orders.reload()"></tr>
              </tbody>
            }
            @case ('ready') {
              <tbody>
                @for (o of ordersList.rows() ?? []; track o.id) {
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
                  <tr
                    uiTableEmpty
                    [columns]="5"
                    icon="shopping-cart"
                    title="Aún no tienes pedidos"
                    description="Tus compras en la tienda aparecerán aquí."
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
export default class OrdersList {
  protected readonly school = inject(SchoolContext);
  private readonly api = inject(StoreApiService);

  protected orders = rxResource({
    params: () => ({ schoolId: this.school.currentSchoolId() }),
    stream: ({ params }) => {
      if (!params.schoolId) {
        return of([]);
      }
      return this.api.myStoreOrders(params.schoolId).pipe(map((rows) => (Array.isArray(rows) ? rows : [])));
    },
  });

  /** orders with smooth loading. */
  protected readonly ordersList = listState(this.orders);

  protected formatPrice(price: unknown): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: this.school.currencyCode(),
    }).format(Number(price));
  }
}
