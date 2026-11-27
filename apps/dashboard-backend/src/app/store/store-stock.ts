import { BadRequestException } from '@nestjs/common';

/** Label of the one variant a product without sizes gets (a book, a lunch box). */
export const SINGLE_VARIANT_LABEL = 'Única';

/** Stock at or under this count shows as "stock bajo" in the store admin. */
export const LOW_STOCK_THRESHOLD = 5;

type VariantStock = { stock: number };

/**
 * Adds the stock summary the catalogue and the store admin show for a product:
 * `totalStock` (sum of every variant) and `hasOutOfStockVariant` (some size sold out while
 * others still have stock). The UI reads these fields; Prisma does not compute them.
 */
export function withStock<T extends { variants: VariantStock[] }>(product: T) {
  const totalStock = product.variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0);
  const hasOutOfStockVariant = totalStock > 0 && product.variants.some((v) => v.stock <= 0);
  return { ...product, totalStock, hasOutOfStockVariant };
}

export function withStockOrNull<T extends { variants: VariantStock[] }>(product: T | null) {
  return product ? withStock(product) : null;
}

type VariantInput = { id?: string; label: string; stock: number; sortOrder?: number };

/**
 * Trims labels, numbers the sort order by position when it is missing, and refuses an empty list
 * or two variants with the same label (the database has a unique index on product + label, which
 * would otherwise surface as a 500).
 */
export function normalizeVariants<T extends VariantInput>(variants: T[]): (T & { sortOrder: number })[] {
  const rows = variants.map((v, i) => ({ ...v, label: v.label.trim(), sortOrder: v.sortOrder ?? i }));
  if (rows.length < 1 || rows.some((v) => !v.label)) {
    throw new BadRequestException('Agrega al menos una talla o variante con nombre.');
  }
  const seen = new Set<string>();
  for (const v of rows) {
    const key = v.label.toLocaleLowerCase('es');
    if (seen.has(key)) {
      throw new BadRequestException(`La talla "${v.label}" está repetida.`);
    }
    seen.add(key);
  }
  return rows;
}
