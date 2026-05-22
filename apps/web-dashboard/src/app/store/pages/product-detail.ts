import { SchoolContext } from '#/shared';
import { Toast } from '#/ui';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { CartService } from '../cart.service';
import { StoreApiService } from '../store-api.service';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a routerLink="../.." class="btn btn-ghost btn-sm gap-1 mb-4">
      <span class="material-symbols-outlined">arrow_back</span>
      Volver
    </a>
    @if (product.isLoading()) {
      <p>Cargando…</p>
    } @else if (!product.value()) {
      <div class="alert alert-error">Producto no encontrado.</div>
    } @else {
      @let p = product.value()!;
      <div class="grid gap-8 lg:grid-cols-2">
        <figure class="rounded-box bg-base-200 aspect-square overflow-hidden">
          @if (p.imageUrl) {
            <img [src]="p.imageUrl" [alt]="p.name" class="h-full w-full object-cover" />
          } @else {
            <div class="flex h-full items-center justify-center text-base-content/30">
              <span class="material-symbols-outlined text-8xl">inventory_2</span>
            </div>
          }
        </figure>
        <div class="space-y-4">
          <h1 class="text-3xl font-bold">{{ p.name }}</h1>
          @if (p.hasOutOfStockVariant) {
            <div class="alert alert-warning py-2 text-sm">Alguna talla está agotada</div>
          }
          <p class="text-2xl font-semibold text-primary">{{ formatPrice(p.price) }}</p>
          @if (p.description) {
            <p class="text-base-content/80 whitespace-pre-wrap">{{ p.description }}</p>
          }
          @if (p.variants?.length) {
            <label class="form-control w-full max-w-xs">
              <span class="label-text">Talla / variante</span>
              <select
                class="select select-bordered"
                [ngModel]="selectedVariantId()"
                (ngModelChange)="selectedVariantId.set($event)"
              >
                @for (v of p.variants; track v.id) {
                  <option [value]="v.id" [disabled]="(v.stock ?? 0) <= 0">
                    {{ v.label }} — {{ (v.stock ?? 0) <= 0 ? 'Agotado' : v.stock + ' disponibles' }}
                  </option>
                }
              </select>
            </label>
          }
          @if (!selectedVariant() || (selectedVariant()?.stock ?? 0) <= 0) {
            <div class="badge badge-error">Sin stock en la talla seleccionada</div>
          } @else {
            <div class="flex flex-wrap gap-2 mt-4">
              <button type="button" class="btn btn-primary" (click)="add(1)">Agregar al carrito</button>
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

  protected product = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) =>
      this.api.publicStoreProduct(params.id).pipe(map((p) => p ?? null)),
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
    this.api
      .addToStoreCart({ variantId: vid, quantity: qty })
      .subscribe({
        next: () => {
          this.toast.showSuccess('Añadido al carrito');
          this.cart.invalidate();
        },
        error: (e: Error) => this.toast.showError(e.message),
      });
  }
}
