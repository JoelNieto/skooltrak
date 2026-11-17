import { Button, Loader, Toast } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { afterRenderEffect, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Auth from './auth';
import { BrandLogo } from '../shared/brand-logo';

@Component({
  selector: 'app-verify-email',
  imports: [Button, BrandLogo, Loader],
  template: `
    <div class="min-h-screen flex flex-col gradient-bg">
      <!-- Fixed Header -->
      <header class="p-4 md:p-6 flex items-center justify-between">
        <app-brand-logo class="h-8 md:h-10" />
      </header>

      <!-- Content -->
      <main class="flex-1 flex flex-col items-center justify-center p-6">
        <div class="w-full max-w-md text-center space-y-8">
          @if (verifying()) {
            <!-- Verifying state -->
            <div class="flex justify-center">
              <lib-loader />
            </div>
            <div class="space-y-2">
              <h1 class="text-2xl md:text-3xl font-bold text-ink-strong">Verificando tu correo...</h1>
              <p class="text-ink-muted">Por favor espera mientras verificamos tu correo electrónico.</p>
            </div>
          } @else if (verified()) {
            <!-- Verified state -->
            <div class="flex justify-center">
              <div class="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-5xl text-success">check_circle</span>
              </div>
            </div>
            <div class="space-y-2">
              <h1 class="text-2xl md:text-3xl font-bold text-ink-strong">Correo Verificado</h1>
              <p class="text-ink-muted">
                Tu correo electrónico ha sido verificado exitosamente. Ahora puedes continuar con la configuración de tu
                escuela.
              </p>
            </div>
            <button uiButton variant="primary" size="lg" (click)="continueToOnboarding()">
              Continuar
              <span class="material-symbols-outlined">arrow_forward</span>
            </button>
          } @else if (error()) {
            <!-- Error state -->
            <div class="flex justify-center">
              <div class="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-5xl text-error">error</span>
              </div>
            </div>
            <div class="space-y-2">
              <h1 class="text-2xl md:text-3xl font-bold text-ink-strong">Error de Verificación</h1>
              <p class="text-ink-muted">
                {{ error() }}
              </p>
            </div>
            <button uiButton [loading]="resending()" variant="primary" (click)="resendEmail()" [disabled]="resending()">
              @if (!resending()) {
                <span class="material-symbols-outlined">mail</span>
              }
              Reenviar correo de verificación
            </button>
          } @else {
            <!-- Waiting for verification state -->
            <div class="flex justify-center">
              <div class="w-20 h-20 rounded-full bg-action-subtle flex items-center justify-center">
                <span class="material-symbols-outlined text-5xl text-primary">mark_email_unread</span>
              </div>
            </div>
            <div class="space-y-2">
              <h1 class="text-2xl md:text-3xl font-bold text-ink-strong">Verifica tu Correo</h1>
              <p class="text-ink-muted">
                Te hemos enviado un correo de verificación. Por favor revisa tu bandeja de entrada y haz clic en el
                enlace para continuar.
              </p>
            </div>

            <div class="bg-surface-0 rounded-xl p-6 space-y-4">
              <div class="flex items-start gap-3 text-left">
                <span class="material-symbols-outlined text-primary mt-0.5">inbox</span>
                <div>
                  <p class="font-medium text-ink-strong">Revisa tu bandeja de entrada</p>
                  <p class="text-sm text-ink-muted">El correo puede tardar unos minutos en llegar</p>
                </div>
              </div>
              <div class="flex items-start gap-3 text-left">
                <span class="material-symbols-outlined text-primary mt-0.5">folder</span>
                <div>
                  <p class="font-medium text-ink-strong">Revisa la carpeta de spam</p>
                  <p class="text-sm text-ink-muted">A veces los correos pueden llegar ahí</p>
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <button
                uiButton
                [loading]="resending()"
                class="w-full"
                (click)="resendEmail()"
                [disabled]="resending() || cooldown() > 0"
              >
                @if (resending()) {
                  Enviando...
                } @else if (cooldown() > 0) {
                  Reenviar en {{ cooldown() }}s
                } @else {
                  <span class="material-symbols-outlined">refresh</span>
                  Reenviar correo de verificación
                }
              </button>

              <button uiButton variant="ghost" size="sm" (click)="checkVerification()">
                <span class="material-symbols-outlined text-lg">sync</span>
                Ya verifiqué mi correo
              </button>
            </div>
          }
        </div>
      </main>

      <!-- Fixed Footer -->
      <footer class="p-4 md:p-6 flex justify-center border-t border-line bg-surface-1/80 backdrop-blur-sm">
        <p class="text-sm text-ink-muted">
          ¿Necesitas ayuda?
          <a href="mailto:soporte@skooltrak.com" class="link link-primary">Contactar soporte</a>
        </p>
      </footer>
    </div>
  `,
})
export default class VerifyEmail {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private auth = inject(Auth);
  private toasts = inject(Toast);

  public verifying = signal(false);
  public verified = signal(false);
  public error = signal<string | null>(null);
  public resending = signal(false);
  public cooldown = signal(0);

  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    afterRenderEffect(() => {
      const token = this.route.snapshot.queryParamMap.get('token');
      const email = this.route.snapshot.queryParamMap.get('email') ?? this.auth.user()?.email;
      if (token && email) {
        void this.verifyToken(token, email);
      }
    });
  }

  private async verifyToken(token: string, email: string) {
    this.verifying.set(true);
    this.error.set(null);

    try {
      const valid = await firstValueFrom(
        this.http.post<boolean>('/api/v1/auth/validate-email-token', { token, email }),
      );
      this.verifying.set(false);
      if (valid) {
        const isVerified = await this.auth.checkEmailVerified();
        if (isVerified) {
          this.verified.set(true);
          this.toasts.showSuccess('Correo verificado exitosamente');
        } else {
          this.verified.set(true);
          this.toasts.showSuccess('Enlace válido. Continúa con la configuración.');
        }
      } else {
        this.error.set('No se pudo verificar el correo. El enlace puede haber expirado.');
      }
    } catch (err: unknown) {
      this.verifying.set(false);
      const message =
        err instanceof Error ? err.message : 'Error al verificar el correo. El enlace puede haber expirado.';
      this.error.set(message);
    }
  }

  public async checkVerification() {
    try {
      const isVerified = await this.auth.checkEmailVerified();
      if (isVerified) {
        this.verified.set(true);
        this.toasts.showSuccess('Correo verificado exitosamente');
      } else {
        this.toasts.showError('Tu correo aún no ha sido verificado');
      }
    } catch {
      this.toasts.showError('Error al verificar el estado');
    }
  }

  public resendEmail() {
    if (this.cooldown() > 0) return;

    const email = this.auth.user()?.email ?? this.route.snapshot.queryParamMap.get('email');
    if (!email) {
      this.toasts.showError('No se encontró un correo para reenviar la verificación');
      return;
    }

    this.resending.set(true);

    this.http.post('/api/v1/auth/send-verification-link', { email }).subscribe({
      next: () => {
        this.resending.set(false);
        this.toasts.showSuccess('Correo de verificación enviado');
        this.error.set(null);
        this.startCooldown();
      },
      error: (err: { message?: string }) => {
        this.resending.set(false);
        this.toasts.showError(err.message || 'Error al enviar el correo');
      },
    });
  }

  private startCooldown() {
    this.cooldown.set(60);
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
    this.cooldownInterval = setInterval(() => {
      const current = this.cooldown();
      if (current <= 1) {
        this.cooldown.set(0);
        if (this.cooldownInterval) {
          clearInterval(this.cooldownInterval);
          this.cooldownInterval = null;
        }
      } else {
        this.cooldown.set(current - 1);
      }
    }, 1000);
  }

  public continueToOnboarding() {
    this.router.navigate(['/onboarding']);
  }
}
