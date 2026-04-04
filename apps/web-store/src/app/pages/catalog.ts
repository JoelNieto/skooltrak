import { SchoolContext } from '@/shared';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { Apollo } from 'apollo-angular';
import { map, of } from 'rxjs';
import { PublicStoreCategoriesDocument, PublicStoreProductsDocument } from '../graphql/generated/graphql';

@Component({
  selector: 'app-store-catalog',
  imports: [RouterLink, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!schoolId()) {
      <div class="alert alert-warning">
        Elige una escuela en <a routerLink="/store" class="link link-primary">la lista de tiendas</a> para ver
        productos.
      </div>
    } @else {
      <div class="flex flex-col gap-4 mb-6">
        <input
          type="search"
          class="input input-bordered w-full max-w-md"
          placeholder="Buscar productos..."
          [ngModel]="search()"
          (ngModelChange)="search.set($event)"
        />
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="btn btn-sm"
            [class.btn-primary]="!categoryId()"
            (click)="categoryId.set(null)"
          >
            Todos
          </button>
          @for (c of categories.value(); track c.id) {
            <button
              type="button"
              class="btn btn-sm"
              [class.btn-primary]="categoryId() === c.id!"
              (click)="categoryId.set(c.id!)"
            >
              {{ c.name }}
            </button>
          }
        </div>
      </div>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        @for (p of products.value(); track p.id) {
          <a
            [routerLink]="['product', p.id]"
            class="card bg-base-100 shadow-md card-interactive border border-base-200 overflow-hidden"
          >
            <figure class="aspect-square bg-base-200">
              @if (p.imageUrl) {
                <img [src]="p.imageUrl" [alt]="p.name" class="h-full w-full object-cover" />
              } @else {
                <div class="flex h-full w-full items-center justify-center text-base-content/40">
                  <span class="material-symbols-outlined text-5xl">inventory_2</span>
                </div>
              }
            </figure>
            <div class="card-body p-4 gap-1">
              <h2 class="card-title text-base line-clamp-2">{{ p.name }}</h2>
              <p class="text-lg font-semibold text-primary">{{ formatPrice(p.price) }}</p>
              @if ((p.stock ?? 0) <= 0) {
                <span class="badge badge-error badge-sm">Agotado</span>
              }
            </div>
          </a>
        } @empty {
          @if (products.isLoading()) {
            <p class="text-base-content/60">Cargando…</p>
          } @else {
            <p class="text-base-content/60">No hay productos.</p>
          }
        }
      </div>
    }
  `,
})
export default class Catalog {
  private readonly apollo = inject(Apollo);
  private readonly schoolContext = inject(SchoolContext);

  protected readonly search = signal('');
  protected readonly categoryId = signal<string | null>(null);
  protected schoolId = () => this.schoolContext.currentSchoolId();

  protected categories = rxResource({
    params: () => ({ schoolId: this.schoolContext.currentSchoolId() }),
    stream: ({ params }) => {
      if (!params.schoolId) return of([]);
      return this.apollo
        .watchQuery({
          query: PublicStoreCategoriesDocument,
          variables: { schoolId: params.schoolId },
          fetchPolicy: 'cache-first',
        })
        .valueChanges.pipe(map((r) => r.data?.publicStoreCategories ?? []));
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
      return this.apollo
        .watchQuery({
          query: PublicStoreProductsDocument,
          variables: {
            schoolId: params.schoolId,
            search,
            categoryId: params.categoryId,
          },
          fetchPolicy: 'network-only',
        })
        .valueChanges.pipe(map((r) => r.data?.publicStoreProducts ?? []));
    },
  });

  protected formatPrice(price: unknown): string {
    const n = Number(price);
    const code = this.schoolContext.currencyCode();
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: code }).format(n);
  }
}
