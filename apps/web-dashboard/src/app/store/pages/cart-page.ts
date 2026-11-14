import { SchoolContext } from '#/shared';
import { Alert, Button, Card, Toast, UiTable } from '#/ui';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartLine, CartService } from '../cart.service';
import { StoreApiService } from '../store-api.service';

@Component({
  selector: 'app-cart-page',
  imports: [Alert, Card, UiTable, Button, RouterLink],
  template: `
    <h2 class="text-xl font-semibold mb-4">Carrito</h2>
    @if (!school.currentSchoolId()) {
      <div uiAlert tone="warning">Selecciona una escuela.</div>
    } @else if (!lines().length) {
      <p class="text-base-content/70 mb-4">Tu carrito está vacío.</p>
      <a uiButton variant="primary" [routerLink]="['..']">Seguir comprando</a>
    } @else {
      <div uiCard class="overflow-x-auto">
        <table uiTable>
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
                <td>
                  <div class="font-medium">{{ line.product?.name }}</div>
                  @if (line.variant?.label) {
                    <div class="text-sm text-base-content/60">Talla: {{ line.variant?.label }}</div>
                  }
                </td>
                <td>{{ formatPrice($safeNavigationMigration(line.product?.price)) }}</td>
                <td>
                  <div class="join">
                    <button
                      uiButton
                      size="sm"
                      type="button"
                      class="join-item"
                      (click)="setQty(line, (line.quantity ?? 0) - 1)"
                    >
                      −
                    </button>
                    <span class="btn btn-sm join-item no-animation">{{ line.quantity }}</span>
                    <button
                      uiButton
                      size="sm"
                      type="button"
                      class="join-item"
                      (click)="setQty(line, (line.quantity ?? 0) + 1)"
                    >
                      +
                    </button>
                  </div>
                </td>
                <td>{{ formatPrice(lineSubtotal(line)) }}</td>
                <td>
                  <button
                    uiButton
                    variant="ghost"
                    size="sm"
                    type="button"
                    class="text-error"
                    (click)="remove(line.id!)"
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <div class="flex justify-between items-center mt-6">
        <button uiButton size="sm" type="button" (click)="clear()">Vaciar carrito</button>
        <div class="text-right">
          <p class="text-lg font-semibold">Total: {{ formatPrice(total()) }}</p>
          <a uiButton variant="primary" [routerLink]="['..', 'checkout']" class="mt-2">Proceder al pago</a>
        </div>
      </div>
    }
  `,
})
export default class CartPage {
  protected readonly school = inject(SchoolContext);
  private readonly cart = inject(CartService);
  private readonly api = inject(StoreApiService);
  private readonly toast = inject(Toast);

  protected lines = () => this.cart.lines();
  protected total = () => this.cart.subtotal();

  protected formatPrice(price: unknown): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: this.school.currencyCode(),
    }).format(Number(price));
  }

  protected lineSubtotal(line: { quantity?: number | null; product?: { price?: unknown } | null }): number {
    return Number(line.product?.price ?? 0) * (line.quantity ?? 0);
  }

  protected setQty(line: CartLine, q: number) {
    if (q < 1) return;
    if (q > (line.variant?.stock ?? 0)) {
      this.toast.showWarning('Stock insuficiente');
      return;
    }
    const cartItemId = line.id;
    if (!cartItemId) return;
    this.api.updateStoreCartItem({ cartItemId, quantity: q }).subscribe({
      next: () => this.cart.invalidate(),
      error: (e: Error) => this.toast.showError(e.message),
    });
  }

  protected remove(id: string) {
    this.api.removeStoreCartItem(id).subscribe({
      next: () => this.cart.invalidate(),
      error: (e: Error) => this.toast.showError(e.message),
    });
  }

  protected clear() {
    const sid = this.school.currentSchoolId();
    if (!sid) return;
    this.api.clearStoreCart(sid).subscribe({
      next: () => this.cart.invalidate(),
      error: (e: Error) => this.toast.showError(e.message),
    });
  }
}
