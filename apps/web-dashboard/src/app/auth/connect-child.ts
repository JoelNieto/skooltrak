import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Toast } from '#/ui';
import Auth from './auth';

@Component({
  selector: 'app-connect-child',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div class="card w-full max-w-md bg-base-100 shadow-xl">
        <div class="card-body items-center text-center">
          <span class="material-symbols-outlined text-4xl" [class.text-primary]="!error()" [class.text-error]="error()">
            {{ error() ? 'error' : (loading() ? 'hourglass_top' : 'child_care') }}
          </span>
          <h2 class="card-title justify-center mt-2">{{ error() ? 'Error' : 'Vinculando estudiante...' }}</h2>
          <p class="text-base-content/70">
            {{ error() || 'Por favor espera mientras vinculamos al estudiante a tu cuenta.' }}
          </p>
          <div class="card-actions justify-center mt-4" *ngIf="error() || !loading()">
            <a routerLink="/login" class="btn btn-primary">Ir al inicio de sesión</a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export default class ConnectChild implements OnInit {
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
      this.error.set('Código QR inválido: falta el token.');
      this.loading.set(false);
      return;
    }

    this.token.set(token);
    this.redeem(token);
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
      const res = await this.http.post<{ status: string; studentId: string }>('/api/v1/auth/child-connect/redeem', { token }).toPromise();
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
