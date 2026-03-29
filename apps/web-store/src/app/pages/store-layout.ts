import { SchoolContext } from '@/shared';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { Apollo } from 'apollo-angular';
import { map } from 'rxjs';
import { CartService } from '../cart.service';
import { StoreMeDocument } from '../graphql/generated/graphql';

@Component({
  selector: 'app-store-layout',
  imports: [RouterOutlet, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="layout-padding pb-10">
      <div class="breadcrumbs text-sm mb-4">
        <ul>
          <li><a routerLink="/home">Inicio</a></li>
          <li><a routerLink="/store">Tienda</a></li>
        </ul>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 class="text-2xl font-semibold text-base-content">Tienda escolar</h1>
        <div class="flex flex-wrap gap-2">
          @if (canManage()) {
            <a routerLink="admin" class="btn btn-outline btn-sm">Administrar tienda</a>
          }
          <a routerLink="cart" class="btn btn-primary btn-sm gap-1">
            <span class="material-symbols-outlined text-lg">shopping_cart</span>
            Carrito
            @if (cartCount() > 0) {
              <span class="badge badge-secondary">{{ cartCount() }}</span>
            }
          </a>
        </div>
      </div>
      <router-outlet />
    </div>
  `,
})
export default class StoreLayout {
  private readonly apollo = inject(Apollo);
  protected readonly cartService = inject(CartService);

  protected readonly me = rxResource({
    stream: () =>
      this.apollo
        .watchQuery({ query: StoreMeDocument, fetchPolicy: 'cache-first' })
        .valueChanges.pipe(map((r) => r.data?.me)),
  });

  protected canManage = () => {
    const perms = this.me.value()?.role?.permissions?.map((p) => p.descriptiveId) ?? [];
    return perms.includes('MANAGE_STORE');
  };

  protected cartCount = () => this.cartService.itemCount();
}
