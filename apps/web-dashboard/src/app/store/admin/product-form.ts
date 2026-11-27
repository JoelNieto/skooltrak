import { SchoolContext } from '#/shared';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  Icon,
  Toast,
  UiChoice,
  UiField,
  UiInput,
  UiSelect,
  UiToggle,
} from '#/ui';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { applyEach, form, FormField, max, maxLength, min, pattern, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom, map, of } from 'rxjs';
import { StoreApiService } from '../store-api.service';
import { storeBaseSegments } from '../store-nav';
import {
  apiError,
  formatMoney,
  isSingleVariant,
  SINGLE_VARIANT_LABEL,
  StoreCategory,
  StoreProduct,
} from '../store.types';

type InventoryMode = 'single' | 'variants';
type VariantModel = { id?: string; label: string; stock: number };

interface ProductFormModel {
  name: string;
  description: string;
  /** Empty string = no category (null in the API). */
  categoryId: string;
  price: number;
  imageUrl: string;
  active: boolean;
  /** Stock when the product has no sizes (mode 'single'). */
  singleStock: number;
  variants: VariantModel[];
}

const SIZE_PRESETS = [
  { label: 'Ropa (XS–XL)', sizes: ['XS', 'S', 'M', 'L', 'XL'] },
  { label: 'Infantil (4–16)', sizes: ['4', '6', '8', '10', '12', '14', '16'] },
  { label: 'Calzado (28–40)', sizes: ['28', '30', '32', '34', '36', '38', '40'] },
];

function emptyModel(): ProductFormModel {
  return {
    name: '',
    description: '',
    categoryId: '',
    price: 0,
    imageUrl: '',
    active: true,
    singleStock: 0,
    variants: [],
  };
}

/**
 * "Nuevo producto" / "Editar producto". One page: details, price, inventory (a single item or one
 * row per size), image, and a live preview of the catalogue card the families will see.
 */
@Component({
  selector: 'app-product-form',
  imports: [
    Alert,
    Badge,
    Button,
    Card,
    CardBody,
    FormField,
    Icon,
    RouterLink,
    UiChoice,
    UiField,
    UiInput,
    UiSelect,
    UiToggle,
  ],
  template: `
    <a [routerLink]="listLink()" class="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink-strong mb-3">
      <ui-icon name="arrow-left" class="text-base" /> Productos
    </a>
    <div class="flex flex-wrap items-center gap-3 mb-6">
      <h2 class="type-heading-md text-ink-strong">{{ id() ? 'Editar producto' : 'Nuevo producto' }}</h2>
      @if (id() && !model().active) {
        <span uiBadge tone="neutral">Oculto</span>
      }
    </div>

    @if (!school.currentSchoolId()) {
      <div uiAlert tone="warning">Selecciona una escuela.</div>
    } @else if (id() && product.error()) {
      <div uiAlert tone="danger">No encontramos este producto. Puede que se haya eliminado.</div>
    } @else if (id() && !loaded()) {
      <p class="text-ink-muted" aria-live="polite">Cargando producto…</p>
    } @else {
      <form class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] items-start" (submit)="onSubmit($event)" novalidate>
        <div class="flex flex-col gap-6 min-w-0">
          <!-- Details -->
          <section uiCard aria-labelledby="pf-details">
            <div uiCardBody class="gap-4">
              <h3 id="pf-details" class="text-base font-semibold text-ink-strong">Información</h3>
              <ui-field label="Nombre" [field]="f.name">
                <input uiInput placeholder="Ej.: Camisa polo del uniforme" [formField]="f.name" />
              </ui-field>
              <ui-field label="Descripción" optional hint="Material, para qué grado es, cómo se retira…">
                <textarea uiInput rows="3" [formField]="f.description"></textarea>
              </ui-field>
              <div class="grid gap-4 sm:grid-cols-2">
                <ui-field label="Categoría" optional>
                  <select uiSelect [formField]="f.categoryId">
                    <option value="">Sin categoría</option>
                    @for (c of categories.value() ?? []; track c.id) {
                      <option [value]="c.id">{{ c.name }}{{ c.active ? '' : ' (oculta)' }}</option>
                    }
                  </select>
                </ui-field>
                <ui-field [label]="'Precio (' + school.currencyCode() + ')'" [field]="f.price">
                  <input uiInput type="number" step="0.01" inputmode="decimal" placeholder="0.00" [formField]="f.price" />
                </ui-field>
              </div>
              @if (addingCategory()) {
                <div class="flex flex-wrap items-end gap-2 rounded-lg border border-line bg-surface-0 p-3">
                  <ui-field label="Nueva categoría" class="flex-1 min-w-48">
                    <input
                      uiInput
                      size="sm"
                      placeholder="Ej.: Uniformes"
                      [value]="newCategoryName()"
                      (input)="newCategoryName.set($any($event.target).value)"
                      (keydown.enter)="$event.preventDefault(); createCategory()"
                    />
                  </ui-field>
                  <button uiButton size="sm" variant="primary" type="button" [loading]="creatingCategory()" (click)="createCategory()">
                    Crear
                  </button>
                  <button uiButton size="sm" variant="ghost" type="button" (click)="addingCategory.set(false)">Cancelar</button>
                </div>
              } @else {
                <button uiButton variant="ghost" size="sm" type="button" class="self-start -mt-2" (click)="addingCategory.set(true)">
                  <ui-icon name="plus" /> Nueva categoría
                </button>
              }
            </div>
          </section>

          <!-- Inventory -->
          <section uiCard aria-labelledby="pf-inventory">
            <div uiCardBody class="gap-4">
              <div class="flex flex-wrap items-baseline justify-between gap-2">
                <h3 id="pf-inventory" class="text-base font-semibold text-ink-strong">Inventario</h3>
                <span class="text-sm text-ink-muted tabular-nums">{{ totalUnits() }} unidades en total</span>
              </div>
              <div role="radiogroup" aria-label="Tipo de inventario" class="grid gap-2 sm:grid-cols-2">
                @for (m of modes; track m.key) {
                  <button
                    type="button"
                    role="radio"
                    [attr.aria-checked]="mode() === m.key"
                    (click)="setMode(m.key)"
                    class="flex items-start gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-primary"
                    [class.border-primary]="mode() === m.key"
                    [class.bg-action-subtle]="mode() === m.key"
                    [class.border-line]="mode() !== m.key"
                    [class.hover:bg-surface-2]="mode() !== m.key"
                  >
                    <ui-icon [name]="m.icon" class="mt-0.5 text-lg text-primary" />
                    <span>
                      <span class="block font-semibold text-ink-strong">{{ m.label }}</span>
                      <span class="block text-xs text-ink-muted">{{ m.hint }}</span>
                    </span>
                  </button>
                }
              </div>

              @if (mode() === 'single') {
                <ui-field label="Unidades disponibles" [field]="f.singleStock" class="max-w-48">
                  <input uiInput type="number" step="1" inputmode="numeric" [formField]="f.singleStock" />
                </ui-field>
              } @else {
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-sm text-ink-muted">Agregar tallas:</span>
                  @for (preset of presets; track preset.label) {
                    <button uiButton size="sm" type="button" (click)="applyPreset(preset.sizes)">{{ preset.label }}</button>
                  }
                </div>
                @if (model().variants.length) {
                  <ul class="flex flex-col gap-2" aria-label="Tallas">
                    @for (row of f.variants; track $index; let i = $index, first = $first, last = $last) {
                      <li class="flex flex-wrap items-start gap-2 rounded-lg border border-line p-2">
                        <ui-field
                          class="flex-1 min-w-32"
                          [label]="i === 0 ? 'Talla o variante' : undefined"
                          [field]="row.label"
                          [error]="duplicateLabels().has(i) ? 'Esta talla está repetida' : null"
                        >
                          <input uiInput size="sm" placeholder="S, M, 32, Azul…" [attr.aria-label]="'Talla ' + (i + 1)" [formField]="row.label" />
                        </ui-field>
                        <ui-field class="w-28" [label]="i === 0 ? 'Stock' : undefined" [field]="row.stock">
                          <input uiInput size="sm" type="number" step="1" inputmode="numeric" [attr.aria-label]="'Stock de la talla ' + (i + 1)" [formField]="row.stock" />
                        </ui-field>
                        <div class="flex items-center gap-1" [class.pt-6]="i === 0">
                          <button uiButton variant="ghost" size="sm" iconOnly type="button" [disabled]="first" [attr.aria-label]="'Subir talla ' + (i + 1)" (click)="moveVariant(i, -1)">
                            <ui-icon name="arrow-up" />
                          </button>
                          <button uiButton variant="ghost" size="sm" iconOnly type="button" [disabled]="last" [attr.aria-label]="'Bajar talla ' + (i + 1)" (click)="moveVariant(i, 1)">
                            <ui-icon name="arrow-down" />
                          </button>
                          <button uiButton variant="ghost" size="sm" iconOnly type="button" class="text-error" [attr.aria-label]="'Quitar talla ' + (i + 1)" (click)="removeVariant(i)">
                            <ui-icon name="trash-2" />
                          </button>
                        </div>
                      </li>
                    }
                  </ul>
                } @else {
                  <p class="rounded-lg border border-dashed border-line p-4 text-center text-sm text-ink-muted">
                    Usa una de las listas de arriba o agrega las tallas una por una.
                  </p>
                }
                <button uiButton variant="ghost" size="sm" type="button" class="self-start" (click)="addVariant()">
                  <ui-icon name="plus" /> Agregar talla
                </button>
              }
            </div>
          </section>

          <!-- Image -->
          <section uiCard aria-labelledby="pf-image">
            <div uiCardBody class="gap-4">
              <h3 id="pf-image" class="text-base font-semibold text-ink-strong">Imagen</h3>
              <ui-field label="Enlace de la imagen" optional [field]="f.imageUrl" hint="Pega un enlace https a una foto cuadrada del producto.">
                <input uiInput type="url" placeholder="https://…" [formField]="f.imageUrl" />
              </ui-field>
              @if (imageUrl() && imageBroken()) {
                <div uiAlert tone="warning" class="text-sm">No pudimos cargar la imagen de ese enlace.</div>
              }
            </div>
          </section>
        </div>

        <!-- Sidebar: preview, visibility, actions -->
        <aside class="flex flex-col gap-4 lg:sticky lg:top-4">
          <div uiCard class="overflow-hidden">
            <p class="px-4 pt-3 type-caption uppercase tracking-wider text-ink-muted">Vista previa</p>
            <figure class="m-3 aspect-square overflow-hidden rounded-lg bg-surface-0">
              @if (imageUrl() && !imageBroken()) {
                <img [src]="imageUrl()" alt="" class="h-full w-full object-cover" (error)="imageBroken.set(true)" (load)="imageBroken.set(false)" />
              } @else {
                <div class="flex h-full w-full items-center justify-center text-ink-subtle">
                  <ui-icon name="image" class="text-5xl" />
                </div>
              }
            </figure>
            <div class="px-4 pb-4 flex flex-col gap-1">
              <p class="font-semibold text-ink-strong line-clamp-2">{{ model().name || 'Nombre del producto' }}</p>
              <p class="text-lg font-semibold text-primary">{{ money(model().price) }}</p>
              @if (totalUnits() <= 0) {
                <span uiBadge tone="danger" size="sm" class="self-start">Agotado</span>
              }
              @if (mode() === 'variants' && previewLabels().length) {
                <p class="text-xs text-ink-muted">Tallas: {{ previewLabels().join(', ') }}</p>
              }
            </div>
          </div>

          <div uiCard>
            <div uiCardBody class="gap-4">
              <ui-choice
                label="Visible en la tienda"
                [hint]="model().active ? 'Las familias pueden verlo y comprarlo.' : 'Queda guardado pero nadie lo ve.'"
              >
                <input uiToggle type="checkbox" [formField]="f.active" />
              </ui-choice>
              @if (problem(); as message) {
                <p class="text-sm text-error" role="alert">{{ message }}</p>
              }
              <div class="flex flex-col gap-2">
                <button uiButton variant="primary" type="submit" [loading]="saving()" [disabled]="saving()">
                  <ui-icon name="save" /> {{ id() ? 'Guardar cambios' : 'Crear producto' }}
                </button>
                @if (!id()) {
                  <button uiButton type="button" [disabled]="saving()" (click)="save(true)">Crear y agregar otro</button>
                }
                <a uiButton variant="ghost" [routerLink]="listLink()">Cancelar</a>
              </div>
            </div>
          </div>
        </aside>
      </form>
    }
  `,
})
export default class ProductForm {
  protected readonly school = inject(SchoolContext);
  private readonly router = inject(Router);
  private readonly api = inject(StoreApiService);
  private readonly toast = inject(Toast);

  /** Route param from `products/:id/edit`; undefined for `products/new`. */
  readonly id = input<string>();

  protected readonly presets = SIZE_PRESETS;
  protected readonly modes = [
    { key: 'single' as const, label: 'Artículo único', hint: 'Libros, útiles, termos: un solo inventario.', icon: 'tag' as const },
    { key: 'variants' as const, label: 'Con tallas o variantes', hint: 'Uniformes y calzado: stock por talla.', icon: 'layers' as const },
  ];

  protected readonly model = signal<ProductFormModel>(emptyModel());
  protected readonly mode = signal<InventoryMode>('single');
  /** Id of the single "Única" variant when editing such a product, so its row is kept. */
  private singleVariantId: string | undefined;

  protected readonly f = form(this.model, (p) => {
    required(p.name, { message: 'Escribe el nombre del producto' });
    maxLength(p.name, 300, { message: 'Máximo 300 caracteres' });
    maxLength(p.description, 8000, { message: 'Máximo 8000 caracteres' });
    required(p.price, { message: 'Indica el precio' });
    min(p.price, 0, { message: 'El precio no puede ser negativo' });
    max(p.price, 9_999_999, { message: 'Precio demasiado alto' });
    min(p.singleStock, 0, { message: 'Mínimo 0' });
    pattern(p.imageUrl, /^(https?:\/\/\S+)?$/, { message: 'Debe ser un enlace que empiece con https://' });
    applyEach(p.variants, (item) => {
      required(item.label, { message: 'Escribe la talla' });
      maxLength(item.label, 120, { message: 'Máximo 120 caracteres' });
      min(item.stock, 0, { message: 'Mínimo 0' });
    });
  });

  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);
  protected readonly imageBroken = signal(false);
  protected readonly addingCategory = signal(false);
  protected readonly newCategoryName = signal('');
  protected readonly creatingCategory = signal(false);

  protected readonly listLink = computed(() => [...storeBaseSegments(this.school), 'admin', 'products']);
  protected readonly imageUrl = computed(() => this.model().imageUrl.trim());

  protected readonly totalUnits = computed(() => {
    const m = this.model();
    if (this.mode() === 'single') return Math.max(0, Number(m.singleStock) || 0);
    return m.variants.reduce((n, v) => n + Math.max(0, Number(v.stock) || 0), 0);
  });

  protected readonly previewLabels = computed(() =>
    this.model()
      .variants.map((v) => v.label.trim())
      .filter(Boolean),
  );

  /** Indexes of rows whose label repeats an earlier one (case-insensitive). */
  protected readonly duplicateLabels = computed(() => {
    const seen = new Set<string>();
    const dupes = new Set<number>();
    this.model().variants.forEach((v, i) => {
      const key = v.label.trim().toLocaleLowerCase('es');
      if (!key) return;
      if (seen.has(key)) dupes.add(i);
      seen.add(key);
    });
    return dupes;
  });

  /** Shown after a submit attempt: the first thing still blocking the save. */
  protected readonly problem = computed(() => {
    if (!this.submitted()) return null;
    if (this.f().invalid()) return 'Revisa los campos marcados.';
    if (this.mode() === 'variants' && this.model().variants.length === 0) return 'Agrega al menos una talla.';
    if (this.duplicateLabels().size) return 'Hay tallas repetidas.';
    return null;
  });

  protected categories = rxResource({
    params: () => ({ schoolId: this.school.currentSchoolId() }),
    stream: ({ params }) => {
      if (!params.schoolId) return of([] as StoreCategory[]);
      return this.api
        .storeCategoriesAdmin(params.schoolId)
        .pipe(map((rows) => (Array.isArray(rows) ? (rows as StoreCategory[]) : [])));
    },
  });

  protected product = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => {
      if (!params.id) return of(null);
      return this.api.storeProductAdmin(params.id).pipe(map((p) => (p ?? null) as StoreProduct | null));
    },
  });

  protected readonly loaded = computed(() => {
    const p = this.product.value();
    return !!p && p.id === this.id();
  });

  constructor() {
    effect(() => {
      const routeId = this.id();
      const p = this.product.value();
      untracked(() => {
        if (!routeId) {
          this.reset();
          return;
        }
        if (p && p.id === routeId) this.fill(p);
      });
    });
    // A new link gets a fresh chance to load.
    effect(() => {
      this.imageUrl();
      untracked(() => this.imageBroken.set(false));
    });
  }

  private reset() {
    this.model.set(emptyModel());
    this.mode.set('single');
    this.singleVariantId = undefined;
    this.submitted.set(false);
  }

  private fill(p: StoreProduct) {
    const variants = [...(p.variants ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
    const single = isSingleVariant(variants) || variants.length === 0;
    this.singleVariantId = single ? variants[0]?.id : undefined;
    this.mode.set(single ? 'single' : 'variants');
    this.model.set({
      name: p.name ?? '',
      description: p.description ?? '',
      categoryId: p.categoryId ?? '',
      price: Number(p.price ?? 0),
      imageUrl: p.imageUrl ?? '',
      active: p.active ?? true,
      singleStock: single ? (variants[0]?.stock ?? 0) : 0,
      variants: single ? [] : variants.map((v) => ({ id: v.id, label: v.label, stock: v.stock })),
    });
  }

  protected setMode(mode: InventoryMode) {
    this.mode.set(mode);
    if (mode === 'variants' && this.model().variants.length === 0) this.addVariant();
  }

  protected addVariant() {
    this.model.update((m) => ({ ...m, variants: [...m.variants, { label: '', stock: 0 }] }));
  }

  protected removeVariant(index: number) {
    this.model.update((m) => ({ ...m, variants: m.variants.filter((_, i) => i !== index) }));
  }

  protected moveVariant(index: number, delta: -1 | 1) {
    this.model.update((m) => {
      const next = [...m.variants];
      const target = index + delta;
      if (target < 0 || target >= next.length) return m;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...m, variants: next };
    });
  }

  /** Adds the preset's sizes that are not on the list yet; drops a blank first row. */
  protected applyPreset(sizes: string[]) {
    this.model.update((m) => {
      const rows = m.variants.filter((v) => v.label.trim() || v.id);
      const have = new Set(rows.map((v) => v.label.trim().toLocaleLowerCase('es')));
      const added = sizes.filter((s) => !have.has(s.toLocaleLowerCase('es'))).map((label) => ({ label, stock: 0 }));
      return { ...m, variants: [...rows, ...added] };
    });
  }

  protected money(value: unknown) {
    return formatMoney(value, this.school.currencyCode());
  }

  protected async createCategory() {
    const schoolId = this.school.currentSchoolId();
    const name = this.newCategoryName().trim();
    if (!schoolId || !name) return;
    this.creatingCategory.set(true);
    try {
      const created = (await firstValueFrom(this.api.createStoreCategory({ schoolId, name }))) as StoreCategory;
      this.categories.reload();
      this.model.update((m) => ({ ...m, categoryId: created.id }));
      this.newCategoryName.set('');
      this.addingCategory.set(false);
      this.toast.showSuccess(`Categoría "${created.name}" creada`);
    } catch (e) {
      this.toast.showError(apiError(e, 'No se pudo crear la categoría'));
    } finally {
      this.creatingCategory.set(false);
    }
  }

  protected onSubmit(event: Event) {
    event.preventDefault();
    this.save(false);
  }

  private variantsPayload(): { id?: string; label: string; stock: number; sortOrder: number }[] {
    const m = this.model();
    if (this.mode() === 'single') {
      return [
        {
          ...(this.singleVariantId ? { id: this.singleVariantId } : {}),
          label: SINGLE_VARIANT_LABEL,
          stock: Math.max(0, Math.trunc(Number(m.singleStock) || 0)),
          sortOrder: 0,
        },
      ];
    }
    return m.variants.map((v, i) => ({
      ...(v.id ? { id: v.id } : {}),
      label: v.label.trim(),
      stock: Math.max(0, Math.trunc(Number(v.stock) || 0)),
      sortOrder: i,
    }));
  }

  protected async save(another: boolean) {
    this.submitted.set(true);
    // submit() marks every field as touched (so errors show) and runs only when the form is valid.
    await submit(this.f, async () => {
      if (!this.problem()) await this.persist(another);
    });
  }

  private async persist(another: boolean) {
    const schoolId = this.school.currentSchoolId();
    if (!schoolId) return;

    const m = this.model();
    const pid = this.id();
    const body = {
      name: m.name.trim(),
      description: m.description.trim(),
      price: Number(m.price),
      imageUrl: m.imageUrl.trim() || null,
      active: m.active,
      variants: this.variantsPayload(),
    };

    this.saving.set(true);
    try {
      if (pid) {
        await firstValueFrom(this.api.updateStoreProduct({ id: pid, ...body, categoryId: m.categoryId || null }));
        this.toast.showSuccess('Producto actualizado');
        this.router.navigate(this.listLink());
      } else {
        await firstValueFrom(
          this.api.createStoreProduct({
            schoolId,
            ...body,
            imageUrl: body.imageUrl ?? undefined,
            categoryId: m.categoryId || undefined,
          }),
        );
        this.toast.showSuccess(`"${body.name}" se agregó a la tienda`);
        if (another) {
          // Keep the category and inventory type: the next product is usually of the same kind.
          const { categoryId } = m;
          const mode = this.mode();
          this.reset();
          this.mode.set(mode);
          this.model.update((x) => ({ ...x, categoryId, variants: mode === 'variants' ? [{ label: '', stock: 0 }] : [] }));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          this.router.navigate(this.listLink());
        }
      }
    } catch (e) {
      this.toast.showError(apiError(e, 'No se pudo guardar el producto'));
    } finally {
      this.saving.set(false);
    }
  }
}
