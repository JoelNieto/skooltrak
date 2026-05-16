import { SchoolContext } from '@/shared';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { StoreApiService } from '../store-api.service';

@Component({
  selector: 'app-order-confirmation',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-lg mx-auto text-center space-y-4 py-8">
      <span class="material-symbols-outlined text-6xl text-success">check_circle</span>
      <h1 class="text-2xl font-bold">¡Pedido confirmado!</h1>
      @if (order.value(); as o) {
        <p class="text-base-content/80">
          Número de pedido: <strong>{{ o.id }}</strong>
        </p>
        <p class="text-lg font-semibold">Total: {{ formatPrice(o.total) }}</p>
        <a [routerLink]="['..', 'orders']" class="btn btn-primary">Ver mis pedidos</a>
        <a [routerLink]="['..']" class="btn btn-ghost btn-sm">Volver a la tienda</a>
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
    stream: ({ params }) =>
      this.api.storeOrder(params.id).pipe(map((o) => o ?? null)),
  });

  protected formatPrice(price: unknown): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: this.school.currencyCode(),
    }).format(Number(price));
  }
}
