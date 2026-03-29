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

@Component({
  selector: 'app-product-form',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h3 class="text-lg font-medium mb-4">{{ productId() ? 'Editar producto' : 'Nuevo producto' }}</h3>
    @if (!school.currentSchoolId()) {
      <div class="alert alert-warning">Selecciona una escuela.</div>
    } @else {
      <form class="grid gap-4 max-w-lg" (ngSubmit)="save()">
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
        <label class="form-control">
          <span class="label-text">Stock</span>
          <input class="input input-bordered" type="number" min="0" [(ngModel)]="stock" name="stock" />
        </label>
        <label class="label cursor-pointer justify-start gap-2">
          <input type="checkbox" class="toggle" [(ngModel)]="active" name="active" />
          <span class="label-text">Activo</span>
        </label>
        <div class="flex gap-2">
          <button type="submit" class="btn btn-primary" [disabled]="saving()">Guardar</button>
          <button type="button" class="btn btn-ghost" (click)="router.navigate(['/store/admin/products'])">Cancelar</button>
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
  protected stock = 0;
  protected active = true;
  protected saving = signal(false);

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

  constructor() {
    effect(() => {
      const p = this.product.value();
      if (!p) return;
      this.name = p.name ?? '';
      this.description = p.description ?? '';
      this.categoryId = p.categoryId ?? null;
      this.price = Number(p.price ?? 0);
      this.imageUrl = p.imageUrl ?? '';
      this.stock = p.stock ?? 0;
      this.active = p.active ?? true;
    });
  }

  protected save() {
    const schoolId = this.school.currentSchoolId();
    if (!schoolId) return;
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
              stock: this.stock,
              active: this.active,
            },
          },
        })
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.toast.showSuccess('Producto actualizado');
            this.router.navigate(['/store/admin/products']);
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
              stock: this.stock,
              active: this.active,
            },
          },
        })
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.toast.showSuccess('Producto creado');
            this.router.navigate(['/store/admin/products']);
          },
          error: (e: Error) => {
            this.saving.set(false);
            this.toast.showError(e.message);
          },
        });
    }
  }
}
