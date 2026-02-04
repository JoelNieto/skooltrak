import { Loader, Toast } from '@/ui';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';
import Auth from './auth';

@Component({
  selector: 'app-verify-email',
  imports: [Loader],
  template: `
    <div class="min-h-screen flex flex-col gradient-bg">
      <!-- Fixed Header -->
      <header class="p-4 md:p-6 flex items-center justify-between">
        <img src="skooltrak.png" alt="Skooltrak" class="h-8 md:h-10" />
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
              <h1 class="text-2xl md:text-3xl font-bold text-base-content">Verificando tu correo...</h1>
              <p class="text-base-content/70">Por favor espera mientras verificamos tu correo electrónico.</p>
            </div>
          } @else if (verified()) {
            <!-- Verified state -->
            <div class="flex justify-center">
              <div class="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-5xl text-success">check_circle</span>
              </div>
            </div>
            <div class="space-y-2">
              <h1 class="text-2xl md:text-3xl font-bold text-base-content">Correo Verificado</h1>
              <p class="text-base-content/70">
                Tu correo electrónico ha sido verificado exitosamente. Ahora puedes continuar con la configuración de tu
                escuela.
              </p>
            </div>
            <button class="btn btn-primary btn-lg" (click)="continueToOnboarding()">
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
              <h1 class="text-2xl md:text-3xl font-bold text-base-content">Error de Verificación</h1>
              <p class="text-base-content/70">
                {{ error() }}
              </p>
            </div>
            <button class="btn btn-primary" (click)="resendEmail()" [disabled]="resending()">
              @if (resending()) {
                <span class="loading loading-spinner loading-sm"></span>
              } @else {
                <span class="material-symbols-outlined">mail</span>
              }
              Reenviar correo de verificación
            </button>
          } @else {
            <!-- Waiting for verification state -->
            <div class="flex justify-center">
              <div class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-5xl text-primary">mark_email_unread</span>
              </div>
            </div>
            <div class="space-y-2">
              <h1 class="text-2xl md:text-3xl font-bold text-base-content">Verifica tu Correo</h1>
              <p class="text-base-content/70">
                Te hemos enviado un correo de verificación. Por favor revisa tu bandeja de entrada y haz clic en el
                enlace para continuar.
              </p>
            </div>

            <div class="bg-base-200 rounded-xl p-6 space-y-4">
              <div class="flex items-start gap-3 text-left">
                <span class="material-symbols-outlined text-primary mt-0.5">inbox</span>
                <div>
                  <p class="font-medium text-base-content">Revisa tu bandeja de entrada</p>
                  <p class="text-sm text-base-content/60">El correo puede tardar unos minutos en llegar</p>
                </div>
              </div>
              <div class="flex items-start gap-3 text-left">
                <span class="material-symbols-outlined text-primary mt-0.5">folder</span>
                <div>
                  <p class="font-medium text-base-content">Revisa la carpeta de spam</p>
                  <p class="text-sm text-base-content/60">A veces los correos pueden llegar ahí</p>
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <button
                class="btn btn-outline btn-block"
                (click)="resendEmail()"
                [disabled]="resending() || cooldown() > 0"
              >
                @if (resending()) {
                  <span class="loading loading-spinner loading-sm"></span>
                  Enviando...
                } @else if (cooldown() > 0) {
                  Reenviar en {{ cooldown() }}s
                } @else {
                  <span class="material-symbols-outlined">refresh</span>
                  Reenviar correo de verificación
                }
              </button>

              <button class="btn btn-ghost btn-sm" (click)="checkVerification()">
                <span class="material-symbols-outlined text-lg">sync</span>
                Ya verifiqué mi correo
              </button>
            </div>
          }
        </div>
      </main>

      <!-- Fixed Footer -->
      <footer class="p-4 md:p-6 flex justify-center border-t border-base-200 bg-base-100/80 backdrop-blur-sm">
        <p class="text-sm text-base-content/60">
          ¿Necesitas ayuda?
          <a href="mailto:soporte@skooltrak.com" class="link link-primary">Contactar soporte</a>
        </p>
      </footer>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VerifyEmail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apollo = inject(Apollo);
  private auth = inject(Auth);
  private toasts = inject(Toast);

  public verifying = signal(false);
  public verified = signal(false);
  public error = signal<string | null>(null);
  public resending = signal(false);
  public cooldown = signal(0);

  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    // Check if there's a token in the URL (from email link)
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.verifyToken(token);
    }
  }

  private async verifyToken(token: string) {
    this.verifying.set(true);
    this.error.set(null);

    this.apollo
      .mutate<{ verifyEmail: { accessToken: string } }>({
        mutation: gql`
          mutation VerifyEmail($token: String!) {
            verifyEmail(token: $token) {
              accessToken
            }
          }
        `,
        variables: { token },
      })
      .subscribe({
        next: (res) => {
          this.verifying.set(false);
          const accessToken = res.data?.verifyEmail?.accessToken;
          if (accessToken) {
            this.auth.token.set(accessToken);
            this.verified.set(true);
            this.toasts.showSuccess('Correo verificado exitosamente');
          } else {
            this.error.set('No se pudo verificar el correo. El enlace puede haber expirado.');
          }
        },
        error: (err) => {
          this.verifying.set(false);
          this.error.set(err.message || 'Error al verificar el correo. El enlace puede haber expirado.');
        },
      });
  }

  public checkVerification() {
    this.apollo
      .query<{ isEmailVerified: boolean }>({
        query: gql`
          query IsEmailVerified {
            isEmailVerified
          }
        `,
        fetchPolicy: 'network-only',
      })
      .subscribe({
        next: (res) => {
          if (res.data?.isEmailVerified) {
            this.verified.set(true);
            this.toasts.showSuccess('Correo verificado exitosamente');
          } else {
            this.toasts.showError('Tu correo aún no ha sido verificado');
          }
        },
        error: () => {
          this.toasts.showError('Error al verificar el estado');
        },
      });
  }

  public resendEmail() {
    if (this.cooldown() > 0) return;

    this.resending.set(true);

    this.apollo
      .mutate<{ resendVerificationEmail: boolean }>({
        mutation: gql`
          mutation ResendVerificationEmail {
            resendVerificationEmail
          }
        `,
      })
      .subscribe({
        next: (res) => {
          this.resending.set(false);
          if (res.data?.resendVerificationEmail) {
            this.toasts.showSuccess('Correo de verificación enviado');
            this.error.set(null);
            this.startCooldown();
          }
        },
        error: (err) => {
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
