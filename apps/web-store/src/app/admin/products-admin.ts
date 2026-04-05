import { Toast } from '@/ui';
import { SchoolContext } from '@/shared';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { Apollo } from 'apollo-angular';
import { map, of } from 'rxjs';
import { DeleteStoreProductDocument, StoreProductsAdminDocument } from '../graphql/generated/graphql';

@Component({
  selector: 'app-products-admin',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-medium">Productos</h3>
      <a routerLink="new" class="btn btn-primary btn-sm">Nuevo producto</a>
    </div>
    @if (!school.currentSchoolId()) {
      <div class="alert alert-warning">Selecciona una escuela.</div>
    } @else {
      <div class="overflow-x-auto rounded-box border border-base-200">
        <table class="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Stock total</th>
              <th>Alerta</th>
              <th>Precio</th>
              <th>Activo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (p of products.value(); track p.id) {
              <tr>
                <td>{{ p.name }}</td>
                <td>{{ p.totalStock }}</td>
                <td>
                  @if (p.hasOutOfStockVariant) {
                    <span class="badge badge-warning badge-sm">Alguna talla agotada</span>
                  } @else {
                    —
                  }
                </td>
                <td>{{ formatPrice(p.price) }}</td>
                <td>{{ p.active ? 'Sí' : 'No' }}</td>
                <td class="flex gap-2">
                  <a [routerLink]="[p.id, 'edit']" class="link link-primary">Editar</a>
                  <button type="button" class="link link-error" (click)="remove(p.id!)">Eliminar</button>
                </td>
              </tr>
            } @empty {
              @if (products.isLoading()) {
                <tr><td colspan="6">Cargando…</td></tr>
              } @else {
                <tr><td colspan="6">Sin productos.</td></tr>
              }
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export default class ProductsAdmin {
  protected readonly school = inject(SchoolContext);
  private readonly apollo = inject(Apollo);
  private readonly toast = inject(Toast);
  private readonly listTick = signal(0);

  protected products = rxResource({
    params: () => ({ schoolId: this.school.currentSchoolId(), tick: this.listTick() }),
    stream: ({ params }) => {
      if (!params.schoolId) return of([]);
      return this.apollo
        .watchQuery({
          query: StoreProductsAdminDocument,
          variables: { schoolId: params.schoolId },
          fetchPolicy: 'network-only',
        })
        .valueChanges.pipe(map((r) => r.data?.storeProductsAdmin ?? []));
    },
  });

  protected formatPrice(price: unknown): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: this.school.currencyCode(),
    }).format(Number(price));
  }

  protected remove(id: string) {
    this.apollo
      .mutate({ mutation: DeleteStoreProductDocument, variables: { id } })
      .subscribe({
        next: () => {
          this.toast.showSuccess('Producto eliminado');
          this.listTick.update((n) => n + 1);
        },
        error: (e: Error) => this.toast.showError(e.message),
      });
  }
}
