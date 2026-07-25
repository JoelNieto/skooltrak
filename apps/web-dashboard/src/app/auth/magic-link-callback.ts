import { Toast } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Auth from './auth';

@Component({
  selector: 'app-magic-link-callback',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div class="card w-full max-w-md bg-base-100 shadow-xl">
        <div class="card-body items-center text-center">
          <span class="material-symbols-outlined text-4xl" [class.text-primary]="!error()" [class.text-error]="error()">
            {{ error() ? 'error' : loading() ? 'hourglass_top' : 'check_circle' }}
          </span>
          <h2 class="card-title justify-center mt-2">{{ error() ? 'Error' : 'Verificando enlace...' }}</h2>
          <p class="text-base-content/70">
            {{ error() || 'Por favor espera mientras completamos tu acceso.' }}
          </p>
          <div class="card-actions justify-center mt-4">
            <a routerLink="/login" class="btn btn-primary">Ir al inicio de sesión</a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export default class MagicLinkCallback implements OnInit {
  token = signal<string | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: Auth,
    private toast: Toast,
  ) {}

  ngOnInit(): void {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) {
      this.error.set('Enlace inválido: falta el token.');
      this.loading.set(false);
      return;
    }

    this.token.set(token);
    this.verify(token);
  }

  async verify(token: string) {
    try {
      const res = await firstValueFrom(
        this.http.post<{ accessToken: string }>('/api/v1/auth/magic-link/verify', { token }),
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
