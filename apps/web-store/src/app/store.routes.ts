import { Routes } from '@angular/router';
import { manageStoreGuard } from './guards/manage-store.guard';

export const STORE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/store-layout'),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./pages/catalog') },
      { path: 'product/:id', loadComponent: () => import('./pages/product-detail') },
      { path: 'cart', loadComponent: () => import('./pages/cart-page') },
      { path: 'checkout', loadComponent: () => import('./pages/checkout') },
      { path: 'order-confirmation/:id', loadComponent: () => import('./pages/order-confirmation') },
      { path: 'orders', loadComponent: () => import('./pages/orders-list') },
      { path: 'orders/:id', loadComponent: () => import('./pages/order-detail') },
      {
        path: 'admin',
        canActivate: [manageStoreGuard],
        loadComponent: () => import('./admin/store-admin'),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'products' },
          { path: 'products', loadComponent: () => import('./admin/products-admin') },
          { path: 'products/new', loadComponent: () => import('./admin/product-form') },
          { path: 'products/:id/edit', loadComponent: () => import('./admin/product-form') },
          { path: 'categories', loadComponent: () => import('./admin/categories-admin') },
          { path: 'orders', loadComponent: () => import('./admin/orders-admin') },
        ],
      },
    ],
  },
];
