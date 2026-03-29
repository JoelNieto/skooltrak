import { Routes } from '@angular/router';
import { STORE_ROUTES } from './store.routes';

export const appRoutes: Routes = [
  {
    path: '',
    children: STORE_ROUTES,
  },
];
