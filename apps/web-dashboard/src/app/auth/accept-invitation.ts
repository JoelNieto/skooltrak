import { Alert, BrandLogo, Button, Card, CardBody, Spinner } from '#/ui';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Auth from './auth';
import { authClient } from './auth-client';

@Component({
  selector: 'app-accept-invitation',
  imports: [Alert, Button, Card, CardBody, Spinner, BrandLogo, RouterLink],
  template: `
    <div class="gradient-bg min-h-screen flex items-center justify-center p-4">
      <div class="max-w-md w-full flex flex-col gap-8 items-center">
        <ui-brand-logo alt="" class="h-12" />
        <div uiCard class="w-full">
          <div uiCardBody class="gap-6 text-center">
            @if (loading()) {
              <span uiSpinner size="lg" class="mx-auto"></span>
              <p class="text-ink-muted">Procesando tu invitación…</p>
            } @else if (error()) {
              <div uiAlert tone="danger" class="text-left">
                <span class="material-symbols-outlined" aria-hidden="true">error</span>
                <div>
                  <h2 class="font-semibold">No pudimos aceptar la invitación</h2>
                  <p>{{ error() }}</p>
                </div>
              </div>
              <a uiButton variant="ghost" routerLink="/login">Ir a iniciar sesión</a>
            } @else if (success()) {
              <div uiAlert tone="success" class="text-left">
                <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
                <div>
                  <h2 class="font-semibold">¡Bienvenido!</h2>
                  <p>Te uniste a {{ organizationName() }}.</p>
                </div>
              </div>
              <a uiButton variant="primary" routerLink="/home">Ir al inicio</a>
            } @else if (needsAuth()) {
              <div>
                <h1 class="text-2xl font-semibold text-ink-strong">Inicia sesión para continuar</h1>
                <p class="mt-2 text-ink-muted">Necesitas una cuenta para aceptar esta invitación.</p>
              </div>
              <div class="flex flex-wrap justify-center gap-3">
                <a
                  uiButton
                  variant="primary"
                  [routerLink]="['/login']"
                  [queryParams]="{ returnUrl: '/accept-invitation/' + invitationId() }"
                  >Iniciar sesión</a
                >
                <a
                  uiButton
                  [routerLink]="['/register']"
                  [queryParams]="{ returnUrl: '/accept-invitation/' + invitationId() }"
                  >Crear cuenta</a
                >
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export default class AcceptInvitationComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(Auth);

  loading = signal(true);
  error = signal<string | null>(null);
  success = signal(false);
  needsAuth = signal(false);
  organizationName = signal('');
  invitationId = signal('');

  constructor() {
    this.invitationId.set(this.route.snapshot.params['id']);
    this.processInvitation();
  }

  private async processInvitation() {
    const invitationId = this.invitationId();

    if (!invitationId) {
      this.error.set('El enlace de invitación no es válido.');
      this.loading.set(false);
      return;
    }

    // Check if user is authenticated
    if (!this.auth.isAuthenticatedSync()) {
      this.needsAuth.set(true);
      this.loading.set(false);
      return;
    }

    try {
      const { data, error } = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (error) {
        this.error.set(error.message || 'No se pudo aceptar la invitación.');
        this.loading.set(false);
        return;
      }

      this.success.set(true);
      this.organizationName.set((data as any)?.organization?.name || 'la organización');
    } catch (err: any) {
      this.error.set(err.message || 'No se pudo aceptar la invitación.');
    } finally {
      this.loading.set(false);
    }
  }
}
