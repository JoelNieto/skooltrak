import { Alert, Badge, BrandLogo, Button, Card, CardBody, Icon, Spinner, Toast, UiCheckbox, UiChoice, UiField, UiInput } from '#/ui';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Auth from './auth';

type InvitationState = 'VALID' | 'EXPIRED' | 'REVOKED' | 'SUPERSEDED' | 'ACCEPTED';

interface InvitationPreview {
  state: InvitationState;
  organizationName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  expiresAt?: string;
}

/**
 * IAM-001 FR .11–.12: the organization admin's invitation link (`/invitacion/:token`).
 * The invitee creates their account here (email locked: the link verifies it) and
 * continues to the setup wizard as ORG_ADMIN of the invited organization.
 */
@Component({
  selector: 'app-accept-org-invitation',
  imports: [Alert, Badge, BrandLogo, Button, Card, CardBody, Icon, Spinner, UiCheckbox, UiChoice, UiField, UiInput, FormField, RouterLink],
  template: `
    <div class="bg-surface-0 min-h-screen px-4 py-12 flex justify-center">
      @if (loading()) {
        <div class="flex flex-col items-center gap-4 pt-24 text-ink-muted" role="status">
          <span uiSpinner size="lg"></span>
          <p>Cargando tu invitación…</p>
        </div>
      } @else if (unusable()) {
        <div class="w-full max-w-md flex flex-col items-center gap-8 pt-12">
          <ui-brand-logo alt="Skooltrak" class="h-10" />
          <div uiCard class="w-full">
            <div uiCardBody class="gap-4">
              <div uiAlert tone="warning">
                <ui-icon name="circle-alert" />
                <div>
                  <h1 class="font-semibold">{{ unusableTitle() }}</h1>
                  <p>{{ unusableMessage() }}</p>
                </div>
              </div>
              <a uiButton [variant]="preview()?.state === 'ACCEPTED' ? 'primary' : 'ghost'" routerLink="/login">
                {{ preview()?.state === 'ACCEPTED' ? 'Iniciar sesión' : 'Ir a iniciar sesión' }}
              </a>
            </div>
          </div>
        </div>
      } @else if (preview(); as invite) {
        <div class="w-full max-w-5xl flex flex-wrap gap-12 items-start">
          <section class="flex-[1_1_380px] min-w-0 flex flex-col gap-6 pt-4">
            <ui-brand-logo alt="Skooltrak" class="h-10 self-start" />
            <div class="flex flex-col gap-3">
              <span uiBadge tone="info" class="self-start">Invitación de administrador</span>
              <h1 class="type-display text-ink-strong">Te damos la bienvenida a {{ invite.organizationName }}</h1>
              <p class="type-body-lg text-ink-body">Crea tu acceso y luego configuramos juntos tu primera escuela.</p>
            </div>
            <ol class="flex flex-col gap-3 text-ink-body">
              <li class="flex items-center gap-3"><span class="step step-current">1</span><span><b>Tu cuenta</b> · ahora</span></li>
              <li class="flex items-center gap-3"><span class="step">2</span>Primera escuela: nombre y siglas</li>
              <li class="flex items-center gap-3"><span class="step">3</span>Grados, planes, cursos y grupos (puedes saltarlos)</li>
            </ol>
          </section>

          <section uiCard class="flex-[1_1_400px] min-w-0 max-w-[480px]" aria-labelledby="accept-title">
            <form uiCardBody class="gap-4" (submit)="onSubmit($event)">
              <h2 id="accept-title" class="type-heading-md text-ink-strong">Crea tu acceso</h2>
              <ui-field label="Correo electrónico" hint="Verificado por la invitación. No necesitas confirmar otro correo.">
                <input uiInput type="email" id="email" [value]="invite.email" readonly aria-readonly="true" />
              </ui-field>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ui-field label="Nombre" [field]="form.firstName">
                  <input uiInput type="text" id="firstName" autocomplete="given-name" [formField]="form.firstName" />
                </ui-field>
                <ui-field label="Apellido" [field]="form.lastName">
                  <input uiInput type="text" id="lastName" autocomplete="family-name" [formField]="form.lastName" />
                </ui-field>
              </div>
              <ui-field label="Contraseña" hint="Mínimo 8 caracteres." [field]="form.password">
                <input uiInput type="password" id="password" autocomplete="new-password" [formField]="form.password" />
              </ui-field>
              <ui-choice label="Acepto los términos y el aviso de privacidad en nombre de la institución.">
                <input uiCheckbox type="checkbox" id="acceptTerms" [formField]="form.acceptTerms" />
              </ui-choice>
              <button uiButton variant="primary" type="submit" class="w-full" [loading]="saving()" [disabled]="saving()">
                Crear cuenta y continuar
              </button>
            </form>
          </section>
        </div>
      }
    </div>
  `,
  styles: `
    .step {
      width: 28px;
      height: 28px;
      flex-shrink: 0;
      border-radius: 999px;
      border: 1px solid var(--color-line-strong);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      color: var(--color-ink-muted);
    }
    .step-current {
      border: 0;
      background: var(--color-primary);
      color: var(--color-primary-content);
      font-weight: 600;
    }
  `,
})
export default class AcceptOrgInvitation {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);
  private readonly toasts = inject(Toast);

  private readonly token = this.route.snapshot.paramMap.get('token') ?? '';
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly preview = signal<InvitationPreview | null>(null);
  /** Unknown token, or a known one that can no longer be used. */
  protected readonly unusable = computed(() => !this.loading() && this.preview()?.state !== 'VALID');

  protected readonly unusableTitle = computed(() =>
    this.preview()?.state === 'ACCEPTED' ? 'Ya aceptaste esta invitación' : 'Este enlace ya no es válido',
  );
  protected readonly unusableMessage = computed(() =>
    this.preview()?.state === 'ACCEPTED'
      ? 'Inicia sesión y te llevamos al paso donde quedaste en la configuración.'
      : 'Venció, se reemplazó por uno más reciente o se anuló. Busca el último correo de Skooltrak o pide uno nuevo a quien te invitó.',
  );

  protected readonly model = signal({ firstName: '', lastName: '', password: '', acceptTerms: false });
  protected readonly form = form(this.model, (path) => {
    required(path.firstName, { message: 'Nombre requerido' });
    required(path.lastName, { message: 'Apellido requerido' });
    required(path.password, { message: 'Contraseña requerida' });
    minLength(path.password, 8, { message: 'Mínimo 8 caracteres' });
  });

  constructor() {
    void this.load();
  }

  private async load() {
    try {
      const preview = await firstValueFrom(
        this.http.get<InvitationPreview>(`/api/v1/auth/org-invitations/${encodeURIComponent(this.token)}`),
      );
      this.preview.set(preview);
      this.model.update((m) => ({ ...m, firstName: preview.firstName ?? '', lastName: preview.lastName ?? '' }));
    } catch {
      this.preview.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  protected async onSubmit(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) {
      this.toasts.showError('Por favor, completa todos los campos');
      return;
    }
    if (!this.model().acceptTerms) {
      this.toasts.showError('Debes aceptar los términos para continuar');
      return;
    }

    this.saving.set(true);
    try {
      const { accessToken } = await firstValueFrom(
        this.http.post<{ accessToken: string }>(
          `/api/v1/auth/org-invitations/${encodeURIComponent(this.token)}/accept`,
          this.model(),
        ),
      );
      this.auth.token.set(accessToken);
      await this.auth.reloadUser();
      await this.router.navigate(['/onboarding/setup']);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 410) {
        // The link stopped being usable while the form was open.
        this.preview.update((p) => (p ? { ...p, state: error.error?.state ?? 'EXPIRED' } : p));
        return;
      }
      const message = error instanceof HttpErrorResponse ? error.error?.message : null;
      this.toasts.showError((Array.isArray(message) ? message[0] : message) ?? 'No pudimos aceptar la invitación');
    } finally {
      this.saving.set(false);
    }
  }
}
