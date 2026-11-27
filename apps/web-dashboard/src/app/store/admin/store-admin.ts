import { SchoolContext } from '#/shared';
import { Icon, PageHeader } from '#/ui';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { storeBaseSegments } from '../store-nav';

/**
 * `/store/:schoolSlug/admin`: header with the store's main action, the admin sections as tabs
 * (same pattern as Finanzas), and a link back to the shopper view.
 */
@Component({
  selector: 'app-store-admin',
  imports: [Icon, PageHeader, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <lib-page-header
      title="Administrar tienda"
      subtitle="Productos, categorías y pedidos de la tienda escolar."
      [actionLabel]="onForm() ? undefined : 'Nuevo producto'"
      actionIcon="plus"
      (action)="newProduct()"
    />
    <div class="flex flex-wrap items-end justify-between gap-2 border-b border-line mb-6">
      <nav class="flex flex-wrap gap-1" aria-label="Secciones de la tienda">
        @for (tab of tabs; track tab.link) {
          <a
            [routerLink]="tab.link"
            routerLinkActive="border-primary! text-primary font-semibold"
            #active="routerLinkActive"
            [attr.aria-current]="active.isActive ? 'page' : null"
            class="inline-flex items-center gap-2 px-3.5 py-2.5 -mb-px border-b-2 border-transparent text-ink-muted hover:text-ink-strong"
          >
            <ui-icon [name]="tab.icon" class="text-base" />
            {{ tab.label }}
          </a>
        }
      </nav>
      <a [routerLink]="base()" class="inline-flex items-center gap-1 pb-2.5 text-sm text-ink-muted hover:text-ink-strong">
        <ui-icon name="external-link" class="text-base" />
        Ver tienda
      </a>
    </div>
    <router-outlet />
  `,
})
export default class StoreAdmin {
  private readonly router = inject(Router);
  private readonly school = inject(SchoolContext);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  /** On the product form the header action would point at the page itself. */
  protected readonly onForm = computed(() => /\/products\/(new|[^/]+\/edit)/.test(this.url()));
  protected readonly base = computed(() => storeBaseSegments(this.school));
  protected readonly tabs = [
    { label: 'Productos', link: 'products', icon: 'tag' },
    { label: 'Categorías', link: 'categories', icon: 'layers' },
    { label: 'Pedidos', link: 'orders', icon: 'receipt' },
  ] as const;

  protected newProduct() {
    this.router.navigate([...this.base(), 'admin', 'products', 'new']);
  }
}
