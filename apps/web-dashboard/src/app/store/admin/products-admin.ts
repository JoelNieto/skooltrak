import { SchoolContext } from '#/shared';
import {
  Alert,
  Badge,
  Button,
  Card,
  Toast,
  UiRowAction,
  UiRowActions,
  UiTable,
  UiTableEmpty,
  UiTableError,
  UiTableSkeleton,
  listState,
} from '#/ui';
import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map, of } from 'rxjs';
import { StoreApiService } from '../store-api.service';
import { storeBaseSegments } from '../store-nav';

@Component({
  selector: 'app-products-admin',
  imports: [Alert, Card, UiTable, UiTableEmpty, UiTableError, UiTableSkeleton, UiRowActions, Badge, Button, RouterLink],
  template: `
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-medium">Productos</h3>
      <a uiButton variant="primary" size="sm" routerLink="new">Nuevo producto</a>
    </div>
    @if (!school.currentSchoolId()) {
      <div uiAlert tone="warning">Selecciona una escuela.</div>
    } @else {
      <div uiCard class="overflow-x-auto">
        <table uiTable [attr.aria-busy]="products.isLoading()">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Stock total</th>
              <th>Alerta</th>
              <th>Precio</th>
              <th>Activo</th>
              <th class="w-12"><span class="sr-only">Acciones</span></th>
            </tr>
          </thead>
          @switch (productsList.phase()) {
            @case ('skeleton') {
              <tbody uiTableSkeleton [columns]="6"></tbody>
            }
            @case ('error') {
              <tbody>
                <tr uiTableError [columns]="6" (retry)="products.reload()"></tr>
              </tbody>
            }
            @case ('ready') {
              <tbody>
                @for (p of productsList.rows() ?? []; track p.id) {
                  <tr>
                    <td>{{ p.name }}</td>
                    <td>{{ p.totalStock }}</td>
                    <td>
                      @if (p.hasOutOfStockVariant) {
                        <span uiBadge tone="warning" size="sm">Alguna talla agotada</span>
                      } @else {
                        —
                      }
                    </td>
                    <td>{{ formatPrice(p.price) }}</td>
                    <td>{{ p.active ? 'Sí' : 'No' }}</td>
                    <td>
                      <ui-row-actions
                        [actions]="rowActions(p.id!)"
                        [label]="'Acciones para ' + p.name"
                        (action)="onRowAction($event, p.id!)"
                      />
                    </td>
                  </tr>
                } @empty {
                  <tr uiTableEmpty [columns]="6" icon="store" title="Aún no hay productos">
                    <a uiButton size="sm" routerLink="new">Nuevo producto</a>
                  </tr>
                }
              </tbody>
            }
          }
        </table>
      </div>
    }
  `,
})
export default class ProductsAdmin {
  protected readonly school = inject(SchoolContext);
  private readonly api = inject(StoreApiService);
  private readonly toast = inject(Toast);
  private readonly listTick = signal(0);

  protected products = rxResource({
    params: () => ({ schoolId: this.school.currentSchoolId(), tick: this.listTick() }),
    stream: ({ params }) => {
      if (!params.schoolId) return of([]);
      return this.api.storeProductsAdmin(params.schoolId).pipe(map((rows) => (Array.isArray(rows) ? rows : [])));
    },
  });

  /** products with smooth loading: previous rows stay while the list reloads. */
  protected readonly productsList = listState(this.products);

  /** The actions in each row's menu (ui-row-actions). */
  protected rowActions(id: string): UiRowAction[] {
    return [
      {
        id: 'edit',
        label: 'Editar',
        icon: 'pencil',
        link: [...storeBaseSegments(this.school), 'admin', 'products', id, 'edit'],
      },
      { id: 'delete', label: 'Eliminar', icon: 'trash-2', tone: 'danger' },
    ];
  }

  protected onRowAction(action: string, id: string): void {
    if (action === 'delete') this.remove(id);
  }

  protected formatPrice(price: unknown): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: this.school.currencyCode(),
    }).format(Number(price));
  }

  protected remove(id: string) {
    this.api.deleteStoreProduct(id).subscribe({
      next: () => {
        this.toast.showSuccess('Producto eliminado');
        this.listTick.update((n) => n + 1);
      },
      error: (e: Error) => this.toast.showError(e.message),
    });
  }
}
