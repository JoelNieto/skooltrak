import { SchoolContext } from '#/shared';
import { Alert, Button, Card, Toast, UiChoice, UiField, UiInput, UiSelect, UiTable, UiToggle } from '#/ui';
import { Component, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { applyEach, form, FormField, maxLength, min, required, submit } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { firstValueFrom, map, of } from 'rxjs';
import { StoreApiService } from '../store-api.service';
import { storeBaseSegments } from '../store-nav';

type VariantModel = { id?: string; label: string; stock: number; sortOrder: number };

interface StoreProductFormModel {
  name: string;
  description: string;
  /** Empty string = no category (maps to null in API). */
  categoryId: string;
  price: number;
  imageUrl: string;
  active: boolean;
  variants: VariantModel[];
}

function emptyStoreProductForm(): StoreProductFormModel {
  return {
    name: '',
    description: '',
    categoryId: '',
    price: 0,
    imageUrl: '',
    active: true,
    variants: [{ label: '', stock: 0, sortOrder: 0 }],
  };
}

@Component({
  selector: 'app-product-form',
  imports: [Alert, Card, UiTable, UiChoice, UiInput, UiSelect, UiToggle, Button, FormField, UiField],
  template: `
    <h3 class="text-lg font-medium mb-4">{{ id() ? 'Editar producto' : 'Nuevo producto' }}</h3>
    @if (!school.currentSchoolId()) {
      <div uiAlert tone="warning">Selecciona una escuela.</div>
    } @else {
      <form class="grid gap-4 max-w-2xl" (submit)="onSubmit($event)" novalidate>
        <ui-field label="Nombre">
          <input uiInput [formField]="productForm.name" />
        </ui-field>
        <ui-field label="Descripción">
          <textarea uiInput [formField]="productForm.description" rows="3"></textarea>
        </ui-field>
        <ui-field label="Categoría">
          <select uiSelect [formField]="productForm.categoryId">
            <option value="">—</option>
            @for (c of categories.value(); track c.id) {
              <option [value]="c.id">{{ c.name }}</option>
            }
          </select>
        </ui-field>
        <ui-field label="Precio">
          <input uiInput type="number" step="0.01" [formField]="productForm.price" />
        </ui-field>
        <ui-field label="URL de imagen" optional>
          <input uiInput [formField]="productForm.imageUrl" />
        </ui-field>

        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <span class="font-medium">Tallas / variantes y stock</span>
            <button uiButton variant="ghost" size="sm" type="button" (click)="addVariantRow()">+ Añadir talla</button>
          </div>
          <p class="text-sm text-ink-muted">
            Ej.: S, M, L o 28, 30, 32. Cada fila es una talla con su propio inventario.
          </p>
          <div uiCard class="overflow-x-auto">
            <table uiTable density="compact">
              <thead>
                <tr>
                  <th>Etiqueta</th>
                  <th>Stock</th>
                  <th>Orden</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (row of productForm.variants; track $index) {
                  <tr>
                    <td>
                      <input uiInput size="sm" class="max-w-40" [formField]="row.label" placeholder="S, M, 32…" />
                    </td>
                    <td>
                      <input uiInput size="sm" class="w-24" type="number" [formField]="row.stock" />
                    </td>
                    <td>
                      <input uiInput size="sm" class="w-16" type="number" [formField]="row.sortOrder" />
                    </td>
                    <td>
                      @if (productModel().variants.length > 1) {
                        <button
                          uiButton
                          variant="ghost"
                          size="sm"
                          type="button"
                          class="text-error"
                          (click)="removeVariantRow($index)"
                        >
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

        <ui-choice label="Activo">
          <input uiToggle tone="neutral" type="checkbox" [formField]="productForm.active" />
        </ui-choice>
        <div class="flex gap-2">
          <button uiButton variant="primary" type="submit" [disabled]="saving() || productForm().invalid()">
            Guardar
          </button>
          <button uiButton variant="ghost" type="button" (click)="goToProductsAdmin()">Cancelar</button>
        </div>
      </form>
    }
  `,
})
export default class ProductForm {
  protected readonly school = inject(SchoolContext);
  protected readonly router = inject(Router);
  private readonly api = inject(StoreApiService);
  private readonly toast = inject(Toast);

  /** Route param from `products/:id/edit`; undefined for `products/new`. */
  protected id = input<string>();

  protected readonly productModel = signal<StoreProductFormModel>(emptyStoreProductForm());

  protected readonly productForm = form(this.productModel, (schemaPath) => {
    required(schemaPath.name, { message: 'El nombre es obligatorio' });
    min(schemaPath.price, 0, { message: 'El precio no puede ser negativo' });
    applyEach(schemaPath.variants, (item) => {
      maxLength(item.label, 120, { message: 'Máximo 120 caracteres' });
      min(item.stock, 0, { message: 'Stock mínimo 0' });
      min(item.sortOrder, 0, { message: 'Orden mínimo 0' });
    });
  });

  protected saving = signal(false);

  protected categories = rxResource({
    params: () => ({ schoolId: this.school.currentSchoolId() }),
    stream: ({ params }) => {
      if (!params.schoolId) return of([]);
      return this.api.storeCategoriesAdmin(params.schoolId).pipe(map((rows) => (Array.isArray(rows) ? rows : [])));
    },
  });

  private product = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => {
      if (!params.id) return of(null);
      return this.api.storeProduct(params.id).pipe(map((p) => p ?? null));
    },
  });

  constructor() {
    effect(() => {
      const routeId = this.id();
      if (!routeId) {
        this.productModel.set(emptyStoreProductForm());
        return;
      }
      const p = this.product.value();
      if (!p) return;
      if (p.id !== routeId) return;
      const vs = p.variants ?? [];
      this.productModel.set({
        name: p.name ?? '',
        description: p.description ?? '',
        categoryId: p.categoryId ?? '',
        price: Number(p.price ?? 0),
        imageUrl: p.imageUrl ?? '',
        active: p.active ?? true,
        variants:
          vs.length > 0
            ? vs.map((v: { id?: string; label?: string | null; stock?: number | null; sortOrder?: number | null }) => ({
                id: v.id,
                label: v.label ?? '',
                stock: v.stock ?? 0,
                sortOrder: v.sortOrder ?? 0,
              }))
            : [{ label: '', stock: 0, sortOrder: 0 }],
      });
    });
  }

  protected goToProductsAdmin() {
    this.router.navigate([...storeBaseSegments(this.school), 'admin', 'products']);
  }

  protected addVariantRow() {
    this.productModel.update((m) => ({
      ...m,
      variants: [...m.variants, { label: '', stock: 0, sortOrder: m.variants.length }],
    }));
  }

  protected removeVariantRow(index: number) {
    this.productModel.update((m) => {
      if (m.variants.length <= 1) return m;
      return { ...m, variants: m.variants.filter((_, i) => i !== index) };
    });
  }

  protected onSubmit(event: Event) {
    event.preventDefault();
    const variants = this.buildVariantsPayload();
    if (!variants) return;

    this.productForm.name().markAsDirty();

    submit(this.productForm, async () => {
      const m = this.productModel();
      const pid = this.id();
      const schoolId = this.school.currentSchoolId();
      if (!schoolId) return;

      this.saving.set(true);
      const categoryId = m.categoryId.trim() ? m.categoryId : null;

      try {
        if (pid) {
          await firstValueFrom(
            this.api.updateStoreProduct({
              id: pid,
              name: m.name,
              description: m.description,
              categoryId,
              price: m.price,
              imageUrl: m.imageUrl || null,
              active: m.active,
              variants: variants.map((v) => ({
                id: v.id,
                label: v.label,
                stock: v.stock,
                sortOrder: v.sortOrder,
              })),
            }),
          );
          this.toast.showSuccess('Producto actualizado');
        } else {
          await firstValueFrom(
            this.api.createStoreProduct({
              schoolId,
              name: m.name,
              description: m.description,
              categoryId: categoryId ?? undefined,
              price: m.price,
              imageUrl: m.imageUrl || undefined,
              active: m.active,
              variants: variants.map((v) => ({
                label: v.label,
                stock: v.stock,
                sortOrder: v.sortOrder,
              })),
            }),
          );
          this.toast.showSuccess('Producto creado');
        }
        this.goToProductsAdmin();
      } catch (e) {
        this.toast.showError(e instanceof Error ? e.message : String(e));
      } finally {
        this.saving.set(false);
      }
    });
  }

  private buildVariantsPayload() {
    const rows = this.productModel()
      .variants.map((r, i) => ({
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
}
