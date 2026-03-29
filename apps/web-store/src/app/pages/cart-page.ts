import { Toast } from '@/ui';
import { SchoolContext } from '@/shared';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { CartService } from '../cart.service';
import {
  ClearStoreCartDocument,
  RemoveStoreCartItemDocument,
  UpdateStoreCartItemDocument,
} from '../graphql/generated/graphql';

@Component({
  selector: 'app-cart-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 class="text-xl font-semibold mb-4">Carrito</h2>
    @if (!school.currentSchoolId()) {
      <div class="alert alert-warning">Selecciona una escuela.</div>
    } @else if (!lines().length) {
      <p class="text-base-content/70 mb-4">Tu carrito está vacío.</p>
      <a routerLink="/store" class="btn btn-primary">Seguir comprando</a>
    } @else {
      <div class="overflow-x-auto rounded-box border border-base-200">
        <table class="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio</th>
              <th>Cantidad</th>
              <th>Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (line of lines(); track line.id) {
              <tr>
                <td>{{ line.product?.name }}</td>
                <td>{{ formatPrice(line.product?.price) }}</td>
                <td>
                  <div class="join">
                    <button type="button" class="btn btn-sm join-item" (click)="setQty(line, (line.quantity ?? 0) - 1)">−</button>
                    <span class="btn btn-sm join-item no-animation">{{ line.quantity }}</span>
                    <button type="button" class="btn btn-sm join-item" (click)="setQty(line, (line.quantity ?? 0) + 1)">+</button>
                  </div>
                </td>
                <td>{{ formatPrice(lineSubtotal(line)) }}</td>
                <td>
                  <button type="button" class="btn btn-ghost btn-sm text-error" (click)="remove(line.id!)">Quitar</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <div class="flex justify-between items-center mt-6">
        <button type="button" class="btn btn-outline btn-sm" (click)="clear()">Vaciar carrito</button>
        <div class="text-right">
          <p class="text-lg font-semibold">Total: {{ formatPrice(total()) }}</p>
          <a routerLink="/store/checkout" class="btn btn-primary mt-2">Proceder al pago</a>
        </div>
      </div>
    }
  `,
})
export default class CartPage {
  protected readonly school = inject(SchoolContext);
  private readonly cart = inject(CartService);
  private readonly apollo = inject(Apollo);
  private readonly toast = inject(Toast);

  protected lines = () => this.cart.lines();
  protected total = () => this.cart.subtotal();

  protected formatPrice(price: unknown): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: this.school.currencyCode(),
    }).format(Number(price));
  }

  protected lineSubtotal(line: {
    quantity?: number | null;
    product?: { price?: unknown } | null;
  }): number {
    return Number(line.product?.price ?? 0) * (line.quantity ?? 0);
  }

  protected setQty(
    line: { id?: string; quantity?: number | null; product?: { stock?: number | null } | null },
    q: number,
  ) {
    if (q < 1) return;
    if (q > (line.product?.stock ?? 0)) {
      this.toast.showWarning('Stock insuficiente');
      return;
    }
    const cartItemId = line.id;
    if (!cartItemId) return;
    this.apollo
      .mutate({
        mutation: UpdateStoreCartItemDocument,
        variables: { input: { cartItemId, quantity: q } },
      })
      .subscribe({
        next: () => this.cart.invalidate(),
        error: (e: Error) => this.toast.showError(e.message),
      });
  }

  protected remove(id: string) {
    this.apollo
      .mutate({
        mutation: RemoveStoreCartItemDocument,
        variables: { cartItemId: id },
      })
      .subscribe({
        next: () => this.cart.invalidate(),
        error: (e: Error) => this.toast.showError(e.message),
      });
  }

  protected clear() {
    const sid = this.school.currentSchoolId();
    if (!sid) return;
    this.apollo
      .mutate({
        mutation: ClearStoreCartDocument,
        variables: { schoolId: sid },
      })
      .subscribe({
        next: () => this.cart.invalidate(),
        error: (e: Error) => this.toast.showError(e.message),
      });
  }
}
