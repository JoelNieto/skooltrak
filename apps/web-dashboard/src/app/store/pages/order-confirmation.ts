import { SchoolContext } from '#/shared';
import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { StoreApiService } from '../store-api.service';
import { Button, Icon } from '#/ui';

@Component({
  selector: 'app-order-confirmation',
  imports: [Button, RouterLink, Icon],
  template: `
    <div class="max-w-lg mx-auto text-center space-y-4 py-8">
      <ui-icon name="circle-check" class="text-6xl text-success" />
      <h1 class="text-2xl font-bold">¡Pedido confirmado!</h1>
      @if (order.value(); as o) {
        <p class="text-ink">
          Número de pedido: <strong>{{ o.id }}</strong>
        </p>
        <p class="text-lg font-semibold">Total: {{ formatPrice(o.total) }}</p>
        <a uiButton variant="primary" [routerLink]="['..', 'orders']">Ver mis pedidos</a>
        <a uiButton variant="ghost" size="sm" [routerLink]="['..']">Volver a la tienda</a>
      } @else if (order.isLoading()) {
        <p>Cargando…</p>
      }
    </div>
  `,
})
export default class OrderConfirmation {
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
}
