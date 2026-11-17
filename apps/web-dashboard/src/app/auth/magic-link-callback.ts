import { Button, Card, CardActions, CardBody, CardTitle, Icon, Toast } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { Component, afterRenderEffect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Auth from './auth';

@Component({
  selector: 'app-magic-link-callback',
  imports: [Card, CardActions, CardBody, CardTitle, Button, RouterLink, Icon],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-surface-0 p-4">
      <div uiCard class="w-full max-w-md">
        <div uiCardBody class="items-center text-center">
          <ui-icon
            [name]="error() ? 'circle-alert' : loading() ? 'hourglass' : 'circle-check'"
            class="text-4xl"
            [class.text-primary]="!error()"
            [class.text-error]="error()"
          />
          <h2 uiCardTitle class="justify-center mt-2">{{ error() ? 'Error' : 'Verificando enlace...' }}</h2>
          <p class="text-ink-muted">
            {{ error() || 'Por favor espera mientras completamos tu acceso.' }}
          </p>
          <div uiCardActions class="justify-center mt-4">
            <a uiButton variant="primary" routerLink="/login">Ir al inicio de sesión</a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export default class MagicLinkCallback {
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
        this.error.set('Enlace inválido: falta el token.');
        this.loading.set(false);
        return;
      }

      this.token.set(token);
      this.verify(token);
    });
  }

  async verify(token: string) {
    try {
      const res = await firstValueFrom(
        // `withCredentials` so the better-auth session cookie set by the verify
        // endpoint is stored alongside the JWT.
        this.http.post<{ accessToken: string }>('/api/v1/auth/magic-link/verify', { token }, { withCredentials: true }),
      );
      const accessToken = res?.accessToken;
      if (accessToken) {
        this.auth.token.set(accessToken);
        await this.auth.redeemPendingChildConnect();
        this.toast.showSuccess('Sesión iniciada correctamente');
        this.router.navigate(['/home']);
        return;
      }
      this.error.set('No se pudo iniciar sesión. Intenta nuevamente.');
    } catch (err: any) {
      const msg = err?.error?.message ?? err?.message ?? 'Enlace inválido o expirado';
      this.error.set(msg);
    } finally {
      this.loading.set(false);
    }
  }
}
