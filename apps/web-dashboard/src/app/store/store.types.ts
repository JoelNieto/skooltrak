import { BadgeTone } from '#/ui';

/** Label of the one variant a product without sizes gets (store-stock.ts in the API). */
export const SINGLE_VARIANT_LABEL = 'Única';

/** Stock at or under this count shows as "stock bajo" in the store admin. */
export const LOW_STOCK_THRESHOLD = 5;

export interface StoreVariant {
  id: string;
  label: string;
  stock: number;
  sortOrder: number;
}

export interface StoreCategory {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
  _count?: { products: number };
}

export interface StoreProduct {
  id: string;
  schoolId: string;
  categoryId: string | null;
  category: StoreCategory | null;
  name: string;
  description: string | null;
  price: string | number;
  imageUrl: string | null;
  active: boolean;
  variants: StoreVariant[];
  /** Added by the API (withStock): sum of every variant's stock. */
  totalStock: number;
  /** Added by the API: some size is sold out while others still have stock. */
  hasOutOfStockVariant: boolean;
  /** Admin list only: order lines that reference the product. */
  _count?: { orderItems: number };
}

export type StoreOrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'READY' | 'DELIVERED' | 'CANCELLED';
export type StorePaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface StoreOrder {
  id: string;
  createdAt: string;
  userId: string;
  user?: { id: string; firstName: string; lastName: string; email: string } | null;
  total: string | number;
  status: StoreOrderStatus;
  paymentStatus: StorePaymentStatus;
  notes: string | null;
  items: { id: string; quantity: number; variantLabel: string | null; product?: { name: string } | null }[];
}

export const ORDER_STATUS_LABEL: Record<StoreOrderStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PROCESSING: 'En preparación',
  READY: 'Listo para retirar',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

export const ORDER_STATUS_TONE: Record<StoreOrderStatus, BadgeTone> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PROCESSING: 'info',
  READY: 'action',
  DELIVERED: 'success',
  CANCELLED: 'neutral',
};

export const PAYMENT_STATUS_LABEL: Record<StorePaymentStatus, string> = {
  PENDING: 'Pago pendiente',
  PAID: 'Pagado',
  FAILED: 'Pago fallido',
  REFUNDED: 'Reembolsado',
};

export const PAYMENT_STATUS_TONE: Record<StorePaymentStatus, BadgeTone> = {
  PENDING: 'warning',
  PAID: 'success',
  FAILED: 'danger',
  REFUNDED: 'neutral',
};

/** A product is "single" when its only variant is the default one: no size picker for shoppers. */
export function isSingleVariant(variants: readonly { label: string }[] | null | undefined): boolean {
  return variants?.length === 1 && variants[0].label === SINGLE_VARIANT_LABEL;
}

export type StockState = 'out' | 'low' | 'partial' | 'ok';

export function stockState(p: Pick<StoreProduct, 'totalStock' | 'hasOutOfStockVariant'>): StockState {
  if ((p.totalStock ?? 0) <= 0) return 'out';
  if (p.totalStock <= LOW_STOCK_THRESHOLD) return 'low';
  if (p.hasOutOfStockVariant) return 'partial';
  return 'ok';
}

export function formatMoney(value: unknown, currency: string): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(Number(value) || 0);
}

/** The server's message from a Nest error response, or the fallback. */
export function apiError(err: unknown, fallback: string): string {
  const message = (err as { error?: { message?: string | string[] } })?.error?.message;
  return (Array.isArray(message) ? message[0] : message) ?? fallback;
}
