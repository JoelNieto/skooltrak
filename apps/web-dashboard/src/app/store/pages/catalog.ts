import { SchoolContext } from '#/shared';
import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { map, of } from 'rxjs';
import { StoreApiService } from '../store-api.service';
import { Alert, Badge, Button, Card, CardBody, CardTitle, Icon, UiInput } from '#/ui';

@Component({
  selector: 'app-store-catalog',
  imports: [Alert, Badge, Card, CardBody, CardTitle, UiInput, Button, RouterLink, FormsModule, Icon],
  template: `
    @if (!schoolId()) {
      <div uiAlert tone="warning">
        Elige una escuela en <a routerLink="/store" class="link link-primary">la lista de tiendas</a> para ver
        productos.
      </div>
    } @else {
      <div class="flex flex-col gap-4 mb-6">
        <input
          uiInput
          type="search"
          class="max-w-md"
          placeholder="Buscar productos..."
          [ngModel]="search()"
          (ngModelChange)="search.set($event)"
        />
        <div class="flex flex-wrap gap-2">
          <button
            uiButton
            size="sm"
            type="button"
            [variant]="!categoryId() ? 'primary' : 'secondary'"
            [attr.aria-pressed]="!categoryId()"
            (click)="categoryId.set(null)"
          >
            Todos
          </button>
          @for (c of categories.value(); track c.id) {
            <button
              type="button"
              uiButton
              size="sm"
              [variant]="categoryId() === c.id! ? 'primary' : 'secondary'"
              [attr.aria-pressed]="categoryId() === c.id!"
              (click)="categoryId.set(c.id!)"
            >
              {{ c.name }}
            </button>
          }
        </div>
      </div>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        @for (p of products.value(); track p.id) {
          <a uiCard [routerLink]="['product', p.id]" class="overflow-hidden">
            <figure class="aspect-square bg-surface-0">
              @if (p.imageUrl) {
                <img [src]="p.imageUrl" [alt]="p.name" class="h-full w-full object-cover" />
              } @else {
                <div class="flex h-full w-full items-center justify-center text-ink-subtle">
                  <ui-icon name="archive" class="text-5xl" />
                </div>
              }
            </figure>
            <div uiCardBody class="p-4 gap-1">
              <h2 uiCardTitle class="text-base line-clamp-2">{{ p.name }}</h2>
              @if (p.hasOutOfStockVariant) {
                <span uiBadge tone="warning" size="sm">Alguna talla agotada</span>
              }
              <p class="text-lg font-semibold text-primary">{{ formatPrice(p.price) }}</p>
              @if ((p.totalStock ?? 0) <= 0) {
                <span uiBadge tone="danger" size="sm">Agotado</span>
              }
            </div>
          </a>
        } @empty {
          @if (products.isLoading()) {
            <p class="text-ink-muted">Cargando…</p>
          } @else {
            <p class="text-ink-muted">No hay productos.</p>
          }
        }
      </div>
    }
  `,
})
export default class Catalog {
  private readonly api = inject(StoreApiService);
  private readonly schoolContext = inject(SchoolContext);

  protected readonly search = signal('');
  protected readonly categoryId = signal<string | null>(null);
  protected schoolId = () => this.schoolContext.currentSchoolId();

  protected categories = rxResource({
    params: () => ({ schoolId: this.schoolContext.currentSchoolId() }),
    stream: ({ params }) => {
      if (!params.schoolId) return of([]);
      return this.api.publicStoreCategories(params.schoolId).pipe(map((rows) => (Array.isArray(rows) ? rows : [])));
    },
  });

  protected products = rxResource({
    params: () => ({
      schoolId: this.schoolContext.currentSchoolId(),
      search: this.search(),
      categoryId: this.categoryId(),
    }),
    stream: ({ params }) => {
      if (!params.schoolId) {
        return of([]);
      }
      const search = params.search?.trim() || null;
      return this.api
        .publicStoreProducts(params.schoolId, search, params.categoryId)
        .pipe(map((rows) => (Array.isArray(rows) ? rows : [])));
    },
  });

  protected formatPrice(price: unknown): string {
    const n = Number(price);
    const code = this.schoolContext.currencyCode();
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: code }).format(n);
  }
}
