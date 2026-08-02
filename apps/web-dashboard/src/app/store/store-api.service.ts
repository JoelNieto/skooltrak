import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import type { Observable } from 'rxjs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

/**
 * REST client for dashboard store + auth session (replaces GraphQL store operations).
 */
@Service()
export class StoreApiService {
  private readonly http = inject(HttpClient);

  getMe(): Observable<Json> {
    return this.http.get<Json>('/api/v1/auth/me');
  }

  updateThemePreference(themePreference: string): Observable<Json> {
    return this.http.patch<Json>('/api/v1/auth/me/theme', { themePreference });
  }

  publicSchoolsForStore(): Observable<Json[]> {
    return this.http.get<Json[]>('/api/v1/store/public/schools');
  }

  publicSchoolBySlug(slug: string): Observable<Json> {
    return this.http.get<Json>(`/api/v1/store/public/schools/by-slug/${encodeURIComponent(slug)}`);
  }

  publicStoreCategories(schoolId: string): Observable<Json[]> {
    return this.http.get<Json[]>('/api/v1/store/public/categories', {
      params: new HttpParams().set('schoolId', schoolId),
    });
  }

  publicStoreProducts(schoolId: string, search?: string | null, categoryId?: string | null): Observable<Json[]> {
    let p = new HttpParams().set('schoolId', schoolId);
    if (search) p = p.set('search', search);
    if (categoryId) p = p.set('categoryId', categoryId);
    return this.http.get<Json[]>('/api/v1/store/public/products', { params: p });
  }

  publicStoreProduct(id: string): Observable<Json> {
    return this.http.get<Json>(`/api/v1/store/public/products/${encodeURIComponent(id)}`);
  }

  storeCategories(schoolId: string): Observable<Json[]> {
    return this.http.get<Json[]>('/api/v1/store/categories', {
      params: new HttpParams().set('schoolId', schoolId),
    });
  }

  storeCategoriesAdmin(schoolId: string): Observable<Json[]> {
    return this.http.get<Json[]>('/api/v1/store/admin/categories', {
      params: new HttpParams().set('schoolId', schoolId),
    });
  }

  storeProducts(schoolId: string, search?: string | null, categoryId?: string | null): Observable<Json[]> {
    let p = new HttpParams().set('schoolId', schoolId);
    if (search) p = p.set('search', search);
    if (categoryId) p = p.set('categoryId', categoryId);
    return this.http.get<Json[]>('/api/v1/store/products', { params: p });
  }

  storeProductsAdmin(schoolId: string): Observable<Json[]> {
    return this.http.get<Json[]>('/api/v1/store/admin/products', {
      params: new HttpParams().set('schoolId', schoolId),
    });
  }

  storeProduct(id: string): Observable<Json> {
    return this.http.get<Json>(`/api/v1/store/products/${encodeURIComponent(id)}`);
  }

  myStoreCart(schoolId: string): Observable<Json[]> {
    return this.http.get<Json[]>('/api/v1/store/cart', {
      params: new HttpParams().set('schoolId', schoolId),
    });
  }

  myStoreOrders(schoolId: string): Observable<Json[]> {
    return this.http.get<Json[]>('/api/v1/store/orders', {
      params: new HttpParams().set('schoolId', schoolId),
    });
  }

  storeOrder(id: string): Observable<Json> {
    return this.http.get<Json>(`/api/v1/store/orders/${encodeURIComponent(id)}`);
  }

  storeOrdersAdmin(schoolId: string): Observable<Json[]> {
    return this.http.get<Json[]>('/api/v1/store/admin/orders', {
      params: new HttpParams().set('schoolId', schoolId),
    });
  }

  addToStoreCart(input: Record<string, unknown>): Observable<Json> {
    return this.http.post<Json>('/api/v1/store/cart/items', input);
  }

  updateStoreCartItem(input: Record<string, unknown>): Observable<Json> {
    return this.http.patch<Json>('/api/v1/store/cart/items', input);
  }

  removeStoreCartItem(cartItemId: string): Observable<Json> {
    return this.http.delete<Json>(`/api/v1/store/cart/items/${encodeURIComponent(cartItemId)}`);
  }

  clearStoreCart(schoolId: string): Observable<Json> {
    return this.http.post<Json>('/api/v1/store/cart/clear', { schoolId });
  }

  checkoutStore(input: Record<string, unknown>): Observable<Json> {
    return this.http.post<Json>('/api/v1/store/checkout', input);
  }

  processStorePayment(input: Record<string, unknown>): Observable<Json> {
    return this.http.post<Json>('/api/v1/store/payments/process', input);
  }

  createStoreCategory(input: Record<string, unknown>): Observable<Json> {
    return this.http.post<Json>('/api/v1/store/admin/categories', input);
  }

  updateStoreCategory(input: Record<string, unknown>): Observable<Json> {
    return this.http.patch<Json>('/api/v1/store/admin/categories', input);
  }

  deleteStoreCategory(id: string): Observable<Json> {
    return this.http.delete<Json>(`/api/v1/store/admin/categories/${encodeURIComponent(id)}`);
  }

  createStoreProduct(input: Record<string, unknown>): Observable<Json> {
    return this.http.post<Json>('/api/v1/store/admin/products', input);
  }

  updateStoreProduct(input: Record<string, unknown>): Observable<Json> {
    return this.http.patch<Json>('/api/v1/store/admin/products', input);
  }

  deleteStoreProduct(id: string): Observable<Json> {
    return this.http.delete<Json>(`/api/v1/store/admin/products/${encodeURIComponent(id)}`);
  }

  updateStoreOrderStatus(input: Record<string, unknown>): Observable<Json> {
    return this.http.patch<Json>('/api/v1/store/admin/orders/status', input);
  }
}
