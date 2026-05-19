import { Loader } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Auth from './auth';

type LookupResult = {
  found: boolean;
  roleLabel?: string | null;
  displayName?: string | null;
  organizationName?: string | null;
};

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, Loader],
  template: `
    <div class="gradient-bg min-h-screen flex items-center justify-center p-4">
      @defer {
        <div class="max-w-md w-full flex flex-col gap-8 items-center">
          <div><img src="skooltrak.png" alt="" class="h-12" /></div>

          <div class="w-full rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <!-- Header Section -->
            <div class="bg-primary p-6 text-white text-center">
              <h1 class="text-2xl font-bold">Recuperar contraseña</h1>
              <p class="text-primary-content mt-2">
                @switch (step()) {
                  @case ('email') {
                    Ingresa tu correo para buscar tu cuenta
                  }
                  @case ('confirm') {
                    ¿Es tu cuenta?
                  }
                  @case ('sent') {
                    Enlace enviado
                  }
                  @case ('not-found') {
                    Cuenta no encontrada
                  }
                  @default {
                    Ingresa tu correo y te enviaremos un enlace
                  }
                }
              </p>
            </div>

            <!-- Form Section -->
            <div class="p-8 bg-base-100">
              @if (step() === 'sent') {
                <div class="alert alert-success mb-4">
                  <span class="material-symbols-outlined">check_circle</span>
                  <span>Revisa tu correo electrónico. Te hemos enviado un enlace para restablecer tu contraseña.</span>
                </div>
                <div class="text-center">
                  <a routerLink="/login" class="btn btn-primary"> Volver al inicio de sesión </a>
                </div>
              } @else if (step() === 'confirm') {
                <div class="space-y-6">
                  <div class="bg-base-200 rounded-lg p-4">
                    <p class="text-base-content/90">
                      Encontramos una cuenta asociada a <strong>{{ searchedEmail() }}</strong
                      >:
                    </p>
                    <p class="mt-2 font-medium">
                      {{ accountInfo().roleLabel }} <strong>{{ accountInfo().displayName }}</strong>
                      @if (accountInfo().organizationName) {
                        en <strong>{{ accountInfo().organizationName }}</strong>
                      }
                    </p>
                  </div>
                  <p class="text-sm text-base-content/70">
                    ¿Es tu cuenta? Confirma para enviarte el enlace de recuperación.
                  </p>
                  <div class="flex flex-col gap-3">
                    <button
                      type="button"
                      class="btn btn-primary w-full"
                      [disabled]="loading()"
                      (click)="confirmAndSendReset()"
                    >
                      @if (loading()) {
                        <span class="loading loading-spinner loading-sm"></span>
                        Enviando...
                      } @else {
                        <span class="material-symbols-outlined">check_circle</span>
                        Sí, enviar enlace
                      }
                    </button>
                    <button
                      type="button"
                      class="btn btn-ghost w-full"
                      [disabled]="loading()"
                      (click)="rejectAndGoBack()"
                    >
                      No, usar otro correo
                    </button>
                  </div>
                </div>
              } @else if (step() === 'not-found') {
                <div class="space-y-6">
                  <div class="alert alert-warning">
                    <span class="material-symbols-outlined">info</span>
                    <span>
                      No encontramos ninguna cuenta con
                      <strong>{{ searchedEmail() }}</strong>
                    </span>
                  </div>
                  <button type="button" class="btn btn-primary w-full" (click)="step.set('email'); form.reset()">
                    Probar con otro correo
                  </button>
                </div>
              } @else {
                <form [formGroup]="form" (ngSubmit)="onLookup()" class="space-y-6">
                  <div class="fieldset">
                    <label for="email">Correo Electrónico</label>
                    <div class="relative">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span class="material-symbols-outlined">mail</span>
                      </div>
                      <input
                        id="email"
                        formControlName="email"
                        type="email"
                        autocomplete="email"
                        class="input input-primary"
                        placeholder="tu@email.com"
                      />
                    </div>
                    @if (form.get('email')?.touched && form.get('email')?.hasError('required')) {
                      <p class="text-error text-xs mt-1">El correo electrónico es requerido</p>
                    }
                    @if (form.get('email')?.touched && form.get('email')?.hasError('email')) {
                      <p class="text-error text-xs mt-1">Ingresa un correo electrónico válido</p>
                    }
                  </div>

                  <button type="submit" [disabled]="loading() || form.invalid" class="btn btn-primary w-full">
                    @if (loading()) {
                      <span class="loading loading-spinner loading-sm"></span>
                      Buscando...
                    } @else {
                      Buscar cuenta
                    }
                  </button>
                </form>

                <div class="divider">o</div>

                <p class="text-center text-sm">
                  ¿Ya recuerdas tu contraseña?
                  <a routerLink="/login" class="link link-primary">Inicia sesión</a>
                </p>
              }
            </div>
          </div>

          <p class="text-base-200 text-center">2025 © Skooltrak. Todos los derechos reservados.</p>
        </div>
      } @placeholder {
        <lib-loader />
      }
    </div>
  `,
})
export default class ForgotPasswordComponent {
  private auth = inject(Auth);
  private http = inject(HttpClient);

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  step = signal<'email' | 'confirm' | 'sent' | 'not-found'>('email');
  loading = signal(false);
  searchedEmail = signal('');
  accountInfo = signal<{
    roleLabel: string;
    displayName: string;
    organizationName?: string;
  }>({ roleLabel: '', displayName: '' });

  onLookup() {
    if (this.form.invalid) return;

    this.loading.set(true);
    const email = this.form.getRawValue().email;
    if (!email) return;
    this.searchedEmail.set(email);

    this.http.post<LookupResult>('/api/v1/auth/lookup-account-for-password-reset', { email }).subscribe({
      next: (data) => {
        this.loading.set(false);
        if (data?.found && data.roleLabel && data.displayName) {
          this.accountInfo.set({
            roleLabel: data.roleLabel,
            displayName: data.displayName,
            organizationName: data.organizationName ?? undefined,
          });
          this.step.set('confirm');
        } else {
          this.step.set('not-found');
        }
      },
      error: () => {
        this.loading.set(false);
        this.step.set('not-found');
      },
    });
  }

  async confirmAndSendReset() {
    const email = this.searchedEmail();
    if (!email) return;

    this.loading.set(true);
    await this.auth.requestPasswordReset(email);
    this.loading.set(false);
    this.step.set('sent');
  }

  rejectAndGoBack() {
    this.step.set('email');
    this.form.reset();
    this.searchedEmail.set('');
  }
}
