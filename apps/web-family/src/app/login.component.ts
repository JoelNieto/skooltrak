import { Toast } from '#/ui';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <div class="min-h-[100dvh] grid place-items-center bg-base-200 p-4">
      <div class="card w-full max-w-sm bg-base-100 shadow-xl">
        <div class="card-body">
          <h1 class="card-title justify-center">Skooltrak Familia</h1>
          <p class="text-center text-sm opacity-60 mb-2">Inicia sesión para ver tus mensajes.</p>

          <form (submit)="submit($event)" class="space-y-3">
            <label class="form-control">
              <span class="label-text">Correo</span>
              <input
                type="email"
                class="input input-bordered"
                [(ngModel)]="email"
                name="email"
                required
                autocomplete="email"
              />
            </label>
            <label class="form-control">
              <span class="label-text">Contraseña</span>
              <input
                type="password"
                class="input input-bordered"
                [(ngModel)]="password"
                name="password"
                required
                autocomplete="current-password"
              />
            </label>

            @if (error()) {
              <p class="text-sm text-error">{{ error() }}</p>
            }

            <button type="submit" class="btn btn-primary w-full" [disabled]="loading()">
              @if (loading()) {
                <span class="loading loading-spinner loading-sm"></span>
              } @else {
                Entrar
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  #auth = inject(AuthService);
  #router = inject(Router);
  #toast = inject(Toast);

  readonly email = signal('');
  readonly password = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  submit(event: Event) {
    event.preventDefault();
    if (this.loading()) return;
    const email = this.email().trim();
    const password = this.password();
    if (!email || !password) return;

    this.loading.set(true);
    this.error.set(null);

    this.#auth.login(email, password).subscribe({
      next: (res) => {
        this.#auth.setToken(res.accessToken);
        this.#router.navigateByUrl('/');
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.message ?? 'No se pudo iniciar sesión';
        this.error.set(msg);
        this.#toast.showError(msg);
      },
    });
  }
}
