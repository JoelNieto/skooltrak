import { Toast } from '@/ui';
import { SchoolContext } from '@/shared';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { Apollo } from 'apollo-angular';
import { map, of } from 'rxjs';
import {
  CreateStoreProductDocument,
  StoreCategoriesAdminDocument,
  StoreProductDocument,
  UpdateStoreProductDocument,
} from '../graphql/generated/graphql';
import { storeBaseSegments } from '../store-nav';

type VariantRow = { id?: string; label: string; stock: number; sortOrder: number };

@Component({
  selector: 'app-product-form',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h3 class="text-lg font-medium mb-4">{{ productId() ? 'Editar producto' : 'Nuevo producto' }}</h3>
    @if (!school.currentSchoolId()) {
      <div class="alert alert-warning">Selecciona una escuela.</div>
    } @else {
      <form class="grid gap-4 max-w-2xl" (ngSubmit)="save()">
        <label class="form-control">
          <span class="label-text">Nombre</span>
          <input class="input input-bordered" [(ngModel)]="name" name="name" required />
        </label>
        <label class="form-control">
          <span class="label-text">Descripción</span>
          <textarea class="textarea textarea-bordered" [(ngModel)]="description" name="desc" rows="3"></textarea>
        </label>
        <label class="form-control">
          <span class="label-text">Categoría</span>
          <select class="select select-bordered" [(ngModel)]="categoryId" name="cat">
            <option [ngValue]="null">—</option>
            @for (c of categories.value(); track c.id) {
              <option [ngValue]="c.id">{{ c.name }}</option>
            }
          </select>
        </label>
        <label class="form-control">
          <span class="label-text">Precio</span>
          <input class="input input-bordered" type="number" min="0" step="0.01" [(ngModel)]="price" name="price" />
        </label>
        <label class="form-control">
          <span class="label-text">URL de imagen (opcional)</span>
          <input class="input input-bordered" [(ngModel)]="imageUrl" name="img" />
        </label>

        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <span class="font-medium">Tallas / variantes y stock</span>
            <button type="button" class="btn btn-ghost btn-sm" (click)="addVariantRow()">+ Añadir talla</button>
          </div>
          <p class="text-sm text-base-content/60">
            Ej.: S, M, L o 28, 30, 32. Cada fila es una talla con su propio inventario.
          </p>
          <div class="overflow-x-auto rounded-box border border-base-200">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Etiqueta</th>
                  <th>Stock</th>
                  <th>Orden</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (row of variantRows; track $index) {
                  <tr>
                    <td>
                      <input
                        class="input input-bordered input-sm w-full max-w-[10rem]"
                        [(ngModel)]="row.label"
                        [name]="'vl' + $index"
                        maxlength="120"
                        placeholder="S, M, 32…"
                      />
                    </td>
                    <td>
                      <input
                        class="input input-bordered input-sm w-24"
                        type="number"
                        min="0"
                        [(ngModel)]="row.stock"
                        [name]="'vs' + $index"
                      />
                    </td>
                    <td>
                      <input
                        class="input input-bordered input-sm w-16"
                        type="number"
                        min="0"
                        [(ngModel)]="row.sortOrder"
                        [name]="'vo' + $index"
                      />
                    </td>
                    <td>
                      @if (variantRows.length > 1) {
                        <button type="button" class="btn btn-ghost btn-xs text-error" (click)="removeVariantRow($index)">
                          Quitar
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <label class="label cursor-pointer justify-start gap-2">
          <input type="checkbox" class="toggle" [(ngModel)]="active" name="active" />
          <span class="label-text">Activo</span>
        </label>
        <div class="flex gap-2">
          <button type="submit" class="btn btn-primary" [disabled]="saving()">Guardar</button>
          <button type="button" class="btn btn-ghost" (click)="goToProductsAdmin()">Cancelar</button>
        </div>
      </form>
    }
  `,
})
export default class ProductForm {
  protected readonly school = inject(SchoolContext);
  protected readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly apollo = inject(Apollo);
  private readonly toast = inject(Toast);

  /** Route param from `products/:id/edit`; undefined for `products/new`. */
  protected productId = signal<string | undefined>(this.route.snapshot.paramMap.get('id') ?? undefined);

  protected name = '';
  protected description = '';
  protected categoryId: string | null = null;
  protected price = 0;
  protected imageUrl = '';
  protected active = true;
  protected saving = signal(false);

  protected variantRows: VariantRow[] = [{ label: '', stock: 0, sortOrder: 0 }];

  protected categories = rxResource({
    params: () => ({ schoolId: this.school.currentSchoolId() }),
    stream: ({ params }) => {
      if (!params.schoolId) return of([]);
      return this.apollo
        .watchQuery({
          query: StoreCategoriesAdminDocument,
          variables: { schoolId: params.schoolId },
          fetchPolicy: 'cache-first',
        })
        .valueChanges.pipe(map((r) => r.data?.storeCategoriesAdmin ?? []));
    },
  });

  private product = rxResource({
    params: () => ({ id: this.productId() }),
    stream: ({ params }) => {
      if (!params.id) return of(null);
      return this.apollo
        .watchQuery({
          query: StoreProductDocument,
          variables: { id: params.id },
          fetchPolicy: 'network-only',
        })
        .valueChanges.pipe(map((r) => r.data?.storeProduct ?? null));
    },
  });

  protected goToProductsAdmin() {
    this.router.navigate([...storeBaseSegments(this.school), 'admin', 'products']);
  }

  protected addVariantRow() {
    this.variantRows = [...this.variantRows, { label: '', stock: 0, sortOrder: this.variantRows.length }];
  }

  protected removeVariantRow(index: number) {
    if (this.variantRows.length <= 1) return;
    this.variantRows = this.variantRows.filter((_, i) => i !== index);
  }

  constructor() {
    effect(() => {
      const p = this.product.value();
      if (!p) return;
      this.name = p.name ?? '';
      this.description = p.description ?? '';
      this.categoryId = p.categoryId ?? null;
      this.price = Number(p.price ?? 0);
      this.imageUrl = p.imageUrl ?? '';
      this.active = p.active ?? true;
      const vs = p.variants ?? [];
      this.variantRows =
        vs.length > 0
          ? vs.map((v) => ({
              id: v.id,
              label: v.label ?? '',
              stock: v.stock ?? 0,
              sortOrder: v.sortOrder ?? 0,
            }))
          : [{ label: '', stock: 0, sortOrder: 0 }];
    });
  }

  private buildVariantsPayload() {
    const rows = this.variantRows
      .map((r, i) => ({
        id: r.id,
        label: r.label.trim(),
        stock: Math.max(0, Number(r.stock) || 0),
        sortOrder: r.sortOrder ?? i,
      }))
      .filter((r) => r.label.length > 0);
    if (rows.length < 1) {
      this.toast.showError('Añade al menos una talla con etiqueta y stock.');
      return null;
    }
    return rows;
  }

  protected save() {
    const schoolId = this.school.currentSchoolId();
    if (!schoolId) return;
    const variants = this.buildVariantsPayload();
    if (!variants) return;
    const pid = this.productId();
    this.saving.set(true);
    if (pid) {
      this.apollo
        .mutate({
          mutation: UpdateStoreProductDocument,
          variables: {
            input: {
              id: pid,
              name: this.name,
              description: this.description,
              categoryId: this.categoryId,
              price: this.price,
              imageUrl: this.imageUrl || null,
              active: this.active,
              variants: variants.map((v) => ({
                id: v.id,
                label: v.label,
                stock: v.stock,
                sortOrder: v.sortOrder,
              })),
            },
          },
        })
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.toast.showSuccess('Producto actualizado');
            this.goToProductsAdmin();
          },
          error: (e: Error) => {
            this.saving.set(false);
            this.toast.showError(e.message);
          },
        });
    } else {
      this.apollo
        .mutate({
          mutation: CreateStoreProductDocument,
          variables: {
            input: {
              schoolId,
              name: this.name,
              description: this.description,
              categoryId: this.categoryId ?? undefined,
              price: this.price,
              imageUrl: this.imageUrl || undefined,
              active: this.active,
              variants: variants.map((v) => ({
                label: v.label,
                stock: v.stock,
                sortOrder: v.sortOrder,
              })),
            },
          },
        })
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.toast.showSuccess('Producto creado');
            this.goToProductsAdmin();
          },
          error: (e: Error) => {
            this.saving.set(false);
            this.toast.showError(e.message);
          },
        });
    }
  }
}
