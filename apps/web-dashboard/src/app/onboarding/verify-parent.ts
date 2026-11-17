import { Alert, Button, Toast, UiField, UiInput, UiSelect } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { afterRenderEffect, Component, inject, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import Auth from '../auth/auth';
import { BrandLogo } from '../shared/brand-logo';

interface LinkChildPayload {
  enrollmentCode: string;
  firstName: string;
  fatherName: string;
  documentId: string;
  phone: string;
  email: string;
  relationship: 'PARENT' | 'GUARDIAN' | 'OTHER';
}

@Component({
  selector: 'app-verify-parent',
  imports: [Alert, UiField, UiInput, UiSelect, Button, BrandLogo, FormField],
  template: `
    <div class="min-h-screen flex flex-col gradient-bg">
      <header class="p-4 md:p-6 flex items-center justify-between">
        <app-brand-logo class="h-8 md:h-10" />
      </header>

      <main class="flex-1 flex flex-col items-center justify-center p-6">
        <div class="w-full max-w-md text-center space-y-8 animate-fade-in">
          <div class="flex justify-center">
            <div class="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center">
              <span class="material-symbols-outlined text-5xl text-warning">family_restroom</span>
            </div>
          </div>

          <div class="space-y-2">
            <h1 class="text-2xl md:text-3xl font-bold text-base-content">Vincula a tu hijo/a</h1>
            <p class="text-base-content/70">
              Ingresa el código de matrícula que te proporcionó la escuela. Tu cuenta quedará vinculada de inmediato,
              sin esperar aprobación.
            </p>
          </div>

          <form (submit)="link($event)" class="space-y-4 text-left">
            <ui-field label="Código de matrícula" [field]="form.enrollmentCode">
              <input
                uiInput
                type="text"
                id="enrollmentCode"
                class="uppercase"
                placeholder="Ej: A1B2C3D4"
                [formField]="form.enrollmentCode"
              />
            </ui-field>

            <div class="grid grid-cols-2 gap-3">
              <ui-field label="Nombres" [field]="form.firstName">
                <input uiInput id="firstName" [formField]="form.firstName" />
              </ui-field>
              <ui-field label="Apellidos" [field]="form.fatherName">
                <input uiInput id="fatherName" [formField]="form.fatherName" />
              </ui-field>
            </div>

            <ui-field label="Documento de identidad" [field]="form.documentId">
              <input uiInput id="documentId" [formField]="form.documentId" />
            </ui-field>

            <div class="grid grid-cols-2 gap-3">
              <ui-field label="Teléfono" [field]="form.phone">
                <input uiInput id="phone" [formField]="form.phone" />
              </ui-field>
              <ui-field label="Correo" [field]="form.email">
                <input uiInput id="email" type="email" [formField]="form.email" />
              </ui-field>
            </div>

            <ui-field label="Parentesco" [field]="form.relationship">
              <select uiSelect id="relationship" [formField]="form.relationship">
                <option value="PARENT">Padre/Madre</option>
                <option value="GUARDIAN">Tutor legal</option>
                <option value="OTHER">Otro</option>
              </select>
            </ui-field>

            @if (errorMessage()) {
              <div uiAlert tone="danger">
                <span class="material-symbols-outlined">error</span>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <div class="pt-2 space-y-3">
              <button
                uiButton
                [loading]="loading()"
                variant="primary"
                type="submit"
                class="w-full"
                [disabled]="loading()"
              >
                @if (loading()) {
                  Vinculando...
                } @else {
                  <span class="material-symbols-outlined">link</span>
                  Vincular cuenta
                }
              </button>
              <button uiButton variant="ghost" size="sm" type="button" class="w-full" (click)="goBack()">
                <span class="material-symbols-outlined text-lg">arrow_back</span>
                Volver
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  `,
  styles: `
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
})
export default class VerifyParent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private toasts = inject(Toast);
  private auth = inject(Auth);

  public schoolId = signal('');
  public schoolName = signal('');
  public loading = signal(false);
  public errorMessage = signal('');

  linkModel = signal<LinkChildPayload>({
    enrollmentCode: '',
    firstName: '',
    fatherName: '',
    documentId: '',
    phone: '',
    email: '',
    relationship: 'PARENT',
  });

  public form = form(this.linkModel, (schemaPath) => {
    required(schemaPath.enrollmentCode, { message: 'El código de matrícula es requerido' });
    required(schemaPath.firstName, { message: 'El nombre es requerido' });
    required(schemaPath.fatherName, { message: 'El apellido es requerido' });
    required(schemaPath.documentId, { message: 'El documento de identidad es requerido' });
    required(schemaPath.phone, { message: 'El teléfono es requerido' });
    required(schemaPath.email, { message: 'El correo es requerido' });
    required(schemaPath.relationship, { message: 'El parentesco es requerido' });
  });

  constructor() {
    afterRenderEffect(() => {
      this.schoolId.set(this.route.snapshot.queryParamMap.get('schoolId') || '');
      this.schoolName.set(this.route.snapshot.queryParamMap.get('schoolName') || '');

      // Pre-populate form with user's existing data
      const user = this.auth.user();
      if (user) {
        this.linkModel.set({
          ...this.linkModel(),
          firstName: user.firstName || '',
          fatherName: user.lastName || '',
          email: user.email || '',
        });
      }
    });
  }

  link(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const raw = this.form().value();
    const payload = {
      enrollmentCode: raw.enrollmentCode.trim().toUpperCase(),
      firstName: raw.firstName,
      fatherName: raw.fatherName,
      documentId: raw.documentId,
      phone: raw.phone,
      email: raw.email,
      relationship: raw.relationship,
    };

    this.http.post<{ status?: string; message?: string }>('/api/v1/auth/link-child', payload).subscribe({
      next: async (result) => {
        this.loading.set(false);
        this.toasts.showSuccess(result?.message || 'Cuenta vinculada exitosamente');
        // Refresh user state so the guard sees onboardingStep = 'completed'
        await this.auth.reloadUser();
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message || err.message || 'Error al vincular la cuenta');
      },
    });
  }

  goBack() {
    this.router.navigate(['/onboarding/select-role'], {
      queryParams: { schoolId: this.schoolId(), schoolName: this.schoolName() },
    });
  }
}
