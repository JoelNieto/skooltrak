import { Route } from '@angular/router';
import { FamilyHomeComponent } from './communication/family-home.component';

export const appRoutes: Route[] = [
  { path: '', component: FamilyHomeComponent },
  { path: '**', redirectTo: '' },
];
