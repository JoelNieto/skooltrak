import { Route } from '@angular/router';
import { authGuard } from './auth.guard';
import { FamilyHomeComponent } from './communication/family-home.component';
import { LoginComponent } from './login.component';

export const appRoutes: Route[] = [
  { path: 'login', component: LoginComponent },
  { path: '', component: FamilyHomeComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
