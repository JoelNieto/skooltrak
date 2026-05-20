import { injectResourceInjector } from '#/client-auth';
import { SchoolContext } from '#/shared';
import { computed, inject, Injectable, ResourceRef, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { map, of } from 'rxjs';
import { StoreApiService } from './store-api.service';

export type CartLine = {
  id?: string;
  quantity?: number | null;
  product?: { name?: string; price?: number | string | null } | null;
  variant?: { label?: string | null; stock?: number | null } | null;
};

@Injectable({ providedIn: 'root' })
export class CartService {
  readonly #resourceInjector = injectResourceInjector();
  private readonly api = inject(StoreApiService);
  private readonly school = inject(SchoolContext);

  /** Bump to refetch cart after mutations */
  readonly refreshTick = signal(0);

  readonly cart!: ResourceRef<CartLine[] | undefined>;

  constructor() {
    this.cart = rxResource({
      injector: this.#resourceInjector,
      params: () => ({
        schoolId: this.school.currentSchoolId(),
        tick: this.refreshTick(),
      }),
      stream: ({ params }) => {
        if (!params.schoolId) {
          return of([]);
        }
        return this.api.myStoreCart(params.schoolId).pipe(
          map((rows) => (Array.isArray(rows) ? (rows as CartLine[]) : [])),
        );
      },
    });
  }

  readonly lines = computed(() => this.cart.value() ?? []);

  readonly itemCount = computed(() => {
    const lines = this.lines();
    return lines.reduce((sum, l) => sum + (l.quantity ?? 0), 0);
  });

  readonly subtotal = computed(() => {
    const lines = this.lines();
    return lines.reduce((sum, l) => {
      const price = Number(l.product?.price ?? 0);
      return sum + price * (l.quantity ?? 0);
    }, 0);
  });

  invalidate() {
    this.refreshTick.update((n) => n + 1);
  }
}
