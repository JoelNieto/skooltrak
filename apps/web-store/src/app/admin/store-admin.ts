import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-store-admin',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="border-b border-base-300 mb-4">
      <ul class="menu menu-horizontal flex-wrap gap-1">
        <li>
          <a routerLink="products" routerLinkActive="bg-primary text-primary-content">Productos</a>
        </li>
        <li>
          <a routerLink="categories" routerLinkActive="bg-primary text-primary-content">Categorías</a>
        </li>
        <li>
          <a routerLink="orders" routerLinkActive="bg-primary text-primary-content">Pedidos</a>
        </li>
      </ul>
    </div>
    <router-outlet />
  `,
})
export default class StoreAdmin {}
