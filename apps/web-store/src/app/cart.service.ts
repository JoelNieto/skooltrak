import { SchoolContext } from '@/shared';
import { computed, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Apollo } from 'apollo-angular';
import { map, of } from 'rxjs';
import { MyStoreCartDocument } from './graphql/generated/graphql';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly apollo = inject(Apollo);
  private readonly school = inject(SchoolContext);

  /** Bump to refetch cart after mutations */
  readonly refreshTick = signal(0);

  readonly cart = rxResource({
    params: () => ({
      schoolId: this.school.currentSchoolId(),
      tick: this.refreshTick(),
    }),
    stream: ({ params }) => {
      if (!params.schoolId) {
        return of([]);
      }
      return this.apollo
        .watchQuery({
          query: MyStoreCartDocument,
          variables: { schoolId: params.schoolId },
          fetchPolicy: 'network-only',
        })
        .valueChanges.pipe(map((r) => r.data?.myStoreCart ?? []));
    },
  });

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
