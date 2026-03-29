import { Toast } from '@/ui';
import { SchoolContext } from '@/shared';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { Apollo } from 'apollo-angular';
import { map } from 'rxjs';
import { CartService } from '../cart.service';
import { AddToStoreCartDocument, StoreProductDocument } from '../graphql/generated/graphql';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a routerLink="/store" class="btn btn-ghost btn-sm gap-1 mb-4">
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
          <p class="text-2xl font-semibold text-primary">{{ formatPrice(p.price) }}</p>
          @if (p.description) {
            <p class="text-base-content/80 whitespace-pre-wrap">{{ p.description }}</p>
          }
          @if ((p.stock ?? 0) <= 0) {
            <div class="badge badge-error">Agotado</div>
          } @else {
            <div class="flex flex-wrap gap-2">
              <button type="button" class="btn btn-primary" (click)="add(1)">Agregar al carrito</button>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export default class ProductDetail {
  readonly id = input.required<string>({ alias: 'id' });
  private readonly apollo = inject(Apollo);
  private readonly school = inject(SchoolContext);
  private readonly cart = inject(CartService);
  private readonly toast = inject(Toast);

  protected product = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) =>
      this.apollo
        .watchQuery({
          query: StoreProductDocument,
          variables: { id: params.id },
          fetchPolicy: 'network-only',
        })
        .valueChanges.pipe(map((r) => r.data?.storeProduct)),
  });

  protected formatPrice(price: unknown): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: this.school.currencyCode(),
    }).format(Number(price));
  }

  protected add(qty: number) {
    const pid = this.id();
    this.apollo
      .mutate({
        mutation: AddToStoreCartDocument,
        variables: { input: { productId: pid, quantity: qty } },
      })
      .subscribe({
        next: () => {
          this.toast.showSuccess('Añadido al carrito');
          this.cart.invalidate();
        },
        error: (e: Error) => this.toast.showError(e.message),
      });
  }
}
