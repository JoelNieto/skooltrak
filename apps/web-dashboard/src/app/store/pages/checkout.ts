import { SchoolContext } from '#/shared';
import { Alert, Button, Card, CardBody, Toast, UiCheckbox, UiChoice, UiField, UiInput } from '#/ui';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CartService } from '../cart.service';
import { StoreApiService } from '../store-api.service';

@Component({
  selector: 'app-checkout',
  imports: [Alert, Card, CardBody, UiCheckbox, UiChoice, UiInput, Button, FormsModule, UiField],
  template: `
    <h2 class="text-xl font-semibold mb-4">Pago (simulado)</h2>
    @if (!school.currentSchoolId()) {
      <div uiAlert tone="warning">Selecciona una escuela.</div>
    } @else if (!cart.lines().length) {
      <p class="mb-4">No hay artículos en el carrito.</p>
    } @else {
      <div class="grid gap-6 lg:grid-cols-2">
        <div class="space-y-3">
          <p class="font-medium">Resumen</p>
          <ul class="space-y-1 text-sm">
            @for (line of cart.lines(); track line.id) {
              <li class="flex justify-between gap-2">
                <span>
                  {{ line.product?.name }}
                  @if (line.variant?.label) {
                    <span class="text-ink-muted"> ({{ line.variant?.label }})</span>
                  }
                  × {{ line.quantity }}
                </span>
                <span>{{ formatPrice(lineSubtotal(line)) }}</span>
              </li>
            }
          </ul>
          <p class="text-lg font-semibold pt-2 border-t border-line">Total: {{ formatPrice(cart.subtotal()) }}</p>
        </div>
        <div uiCard>
          <div uiCardBody class="gap-3">
            <ui-field label="Nombre en la tarjeta (demo)">
              <input uiInput [(ngModel)]="cardName" />
            </ui-field>
            <ui-field label="Últimos 4 dígitos (demo)">
              <input uiInput maxlength="4" [(ngModel)]="cardLast4" />
            </ui-field>
            <ui-choice label="Simular pago fallido">
              <input uiCheckbox type="checkbox" [(ngModel)]="simulateFail" />
            </ui-choice>
            <button uiButton variant="primary" type="button" [disabled]="paying()" (click)="pay()">
              @if (paying()) {
                Procesando…
              } @else {
                Pagar ahora
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export default class Checkout {
  protected readonly school = inject(SchoolContext);
  protected readonly cart = inject(CartService);
  private readonly api = inject(StoreApiService);
  private readonly toast = inject(Toast);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected cardName = 'Demo Usuario';
  protected cardLast4 = '4242';
  protected simulateFail = false;
  protected paying = signal(false);

  protected formatPrice(n: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: this.school.currencyCode(),
    }).format(n);
  }

  protected lineSubtotal(line: { quantity?: number | null; product?: { price?: unknown } | null }): number {
    return Number(line.product?.price ?? 0) * (line.quantity ?? 0);
  }

  protected pay() {
    const schoolId = this.school.currentSchoolId();
    if (!schoolId) return;
    this.paying.set(true);
    this.api
      .checkoutStore({
        schoolId,
        notes: `Tarjeta ****${this.cardLast4} · ${this.cardName}`,
      })
      .subscribe({
        next: (order) => {
          const orderId = (order as { id?: string })?.id;
          if (!orderId) {
            this.paying.set(false);
            return;
          }
          this.api
            .processStorePayment({
              orderId,
              simulateSuccess: !this.simulateFail,
            })
            .subscribe({
              next: (r2) => {
                this.paying.set(false);
                this.cart.invalidate();
                const st = (r2 as { paymentStatus?: string })?.paymentStatus;
                if (st === 'FAILED') {
                  this.toast.showError('El pago fue rechazado (simulación).');
                  this.router.navigate(['../orders', orderId], { relativeTo: this.route });
                } else {
                  this.toast.showSuccess('¡Pago exitoso!');
                  this.router.navigate(['../order-confirmation', orderId], {
                    relativeTo: this.route,
                  });
                }
              },
              error: (e: Error) => {
                this.paying.set(false);
                this.toast.showError(e.message);
              },
            });
        },
        error: (e: Error) => {
          this.paying.set(false);
          this.toast.showError(e.message);
        },
      });
  }
}
