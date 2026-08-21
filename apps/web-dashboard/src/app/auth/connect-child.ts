import { Toast } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { Component, afterRenderEffect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Auth from './auth';

@Component({
  selector: 'app-connect-child',
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div class="card w-full max-w-md bg-base-100 shadow-xl">
        <div class="card-body items-center text-center">
          <span class="material-symbols-outlined text-4xl" [class.text-primary]="!error()" [class.text-error]="error()">
            {{ error() ? 'error' : loading() ? 'hourglass_top' : 'child_care' }}
          </span>
          <h2 class="card-title justify-center mt-2">{{ error() ? 'Error' : 'Vinculando estudiante...' }}</h2>
          <p class="text-base-content/70">
            {{ error() || 'Por favor espera mientras vinculamos al estudiante a tu cuenta.' }}
          </p>
          @if (error() || !loading()) {
            <div class="card-actions justify-center mt-4">
              <a routerLink="/login" class="btn btn-primary">Ir al inicio de sesión</a>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export default class ConnectChild {
  token = signal<string | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly auth = inject(Auth);
  private readonly toast = inject(Toast);

  constructor() {
    afterRenderEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      if (!token) {
        this.error.set('Código QR inválido: falta el token.');
        this.loading.set(false);
        return;
      }

      this.token.set(token);
      this.redeem(token);
    });
  }

  async redeem(token: string) {
    if (this.auth.isAuthenticated()) {
      await this.redeemAuthenticated(token);
      return;
    }

    const key = 'pending_child_connect_token';
    if (isPlatformBrowser()) {
      localStorage.setItem(key, token);
    }
    this.router.navigate(['/login']);
  }

  async redeemAuthenticated(token: string) {
    try {
      const res = await firstValueFrom(
        this.http.post<{ status: string; studentId: string }>('/api/v1/auth/child-connect/redeem', { token }),
      );
      if (res?.status === 'LINKED') {
        this.toast.showSuccess('Estudiante vinculado exitosamente');
        this.router.navigate(['/students', res.studentId]);
        return;
      }
      this.error.set('No se pudo vincular el estudiante.');
    } catch (err: any) {
      const msg = err?.error?.message ?? err?.message ?? 'Código QR inválido o expirado';
      this.error.set(msg);
    } finally {
      this.loading.set(false);
    }
  }
}

function isPlatformBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}
