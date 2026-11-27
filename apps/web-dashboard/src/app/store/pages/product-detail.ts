import { SchoolContext } from '#/shared';
import { Alert, Badge, Button, Icon, Toast, UiField, UiSelect } from '#/ui';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { CartService } from '../cart.service';
import { StoreApiService } from '../store-api.service';
import { isSingleVariant } from '../store.types';

@Component({
  selector: 'app-product-detail',
  imports: [Alert, Badge, UiSelect, Button, RouterLink, FormsModule, UiField, Icon],
  template: `
    <a uiButton variant="ghost" size="sm" routerLink="../.." class="gap-1 mb-4">
      <ui-icon name="arrow-left" />
      Volver
    </a>
    @if (product.isLoading()) {
      <p>Cargando…</p>
    } @else if (!product.value()) {
      <div uiAlert tone="danger">Producto no encontrado.</div>
    } @else {
      @let p = product.value()!;
      <div class="grid gap-8 lg:grid-cols-2">
        <figure class="rounded-box bg-surface-0 aspect-square overflow-hidden">
          @if (p.imageUrl) {
            <img [src]="p.imageUrl" [alt]="p.name" class="h-full w-full object-cover" />
          } @else {
            <div class="flex h-full items-center justify-center text-ink-subtle">
              <ui-icon name="archive" class="text-8xl" />
            </div>
          }
        </figure>
        <div class="space-y-4">
          <h1 class="text-3xl font-bold">{{ p.name }}</h1>
          @if (p.hasOutOfStockVariant) {
            <div uiAlert tone="warning" class="py-2 text-sm">Alguna talla está agotada</div>
          }
          <p class="text-2xl font-semibold text-primary">{{ formatPrice(p.price) }}</p>
          @if (p.description) {
            <p class="text-ink whitespace-pre-wrap">{{ p.description }}</p>
          }
          @if (single()) {
            <p class="text-sm text-ink-muted">
              {{ (p.variants[0]?.stock ?? 0) > 0 ? p.variants[0].stock + ' disponibles' : 'Agotado' }}
            </p>
          } @else if (p.variants?.length) {
            <ui-field label="Talla / variante" class="w-full max-w-xs">
              <select uiSelect [ngModel]="selectedVariantId()" (ngModelChange)="selectedVariantId.set($event)">
                @for (v of p.variants; track v.id) {
                  <option [value]="v.id" [disabled]="(v.stock ?? 0) <= 0">
                    {{ v.label }} — {{ (v.stock ?? 0) <= 0 ? 'Agotado' : v.stock + ' disponibles' }}
                  </option>
                }
              </select>
            </ui-field>
          }
          @if (!selectedVariant() || (selectedVariant()?.stock ?? 0) <= 0) {
            <div uiBadge tone="danger">{{ single() ? 'Agotado' : 'Sin stock en la talla seleccionada' }}</div>
          } @else {
            <div class="flex flex-wrap gap-2 mt-4">
              <button uiButton variant="primary" type="button" (click)="add(1)">Agregar al carrito</button>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export default class ProductDetail {
  readonly id = input.required<string>();
  private readonly api = inject(StoreApiService);
  private readonly school = inject(SchoolContext);
  private readonly cart = inject(CartService);
  private readonly toast = inject(Toast);

  protected selectedVariantId = signal<string | null>(null);
  /** Products without sizes have one "Única" variant: no picker, just the stock. */
  protected readonly single = computed(() => isSingleVariant(this.product.value()?.variants));

  protected product = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.publicStoreProduct(params.id).pipe(map((p) => p ?? null)),
  });

  constructor() {
    effect(() => {
      const p = this.product.value();
      const variants = p?.variants ?? [];
      const current = this.selectedVariantId();
      if (!variants.length) {
        this.selectedVariantId.set(null);
        return;
      }
      const stillValid = current && variants.some((v: { id?: string }) => v.id === current);
      if (!stillValid) {
        const firstInStock = variants.find((v: { stock?: number | null }) => (v.stock ?? 0) > 0);
        this.selectedVariantId.set((firstInStock ?? variants[0]).id ?? null);
      }
    });
  }

  protected selectedVariant() {
    const p = this.product.value();
    const vid = this.selectedVariantId();
    if (!p?.variants?.length || !vid) return null;
    return p.variants.find((v: { id?: string }) => v.id === vid) ?? null;
  }

  protected formatPrice(price: unknown): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: this.school.currencyCode(),
    }).format(Number(price));
  }

  protected add(qty: number) {
    const vid = this.selectedVariantId();
    if (!vid) return;
    const v = this.selectedVariant();
    if (!v || (v.stock ?? 0) < qty) {
      this.toast.showError('Stock insuficiente');
      return;
    }
    this.api.addToStoreCart({ variantId: vid, quantity: qty }).subscribe({
      next: () => {
        this.toast.showSuccess('Añadido al carrito');
        this.cart.invalidate();
      },
      error: (e: Error) => this.toast.showError(e.message),
    });
  }
}
