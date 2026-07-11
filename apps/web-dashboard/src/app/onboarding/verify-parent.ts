import { Toast } from '#/ui';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Auth from '../auth/auth';

@Component({
  selector: 'app-verify-parent',
  imports: [ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex flex-col gradient-bg">
      <header class="p-4 md:p-6 flex items-center justify-between">
        <img src="skooltrak.png" alt="Skooltrak" class="h-8 md:h-10" />
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
              Ingresa el código de matrícula que te proporcionó la escuela. Tu cuenta quedará
              vinculada de inmediato, sin esperar aprobación.
            </p>
          </div>

          <form [formGroup]="form" (ngSubmit)="link()" class="space-y-4 text-left">
            <div class="fieldset">
              <label for="enrollmentCode" class="label">
                <span class="label-text font-medium">Código de matrícula</span>
              </label>
              <input
                type="text"
                id="enrollmentCode"
                class="input input-bordered w-full uppercase"
                placeholder="Ej: A1B2C3D4"
                formControlName="enrollmentCode"
              />
              @if (form.get('enrollmentCode')?.touched && form.get('enrollmentCode')?.hasError('required')) {
                <p class="text-error text-xs mt-1">El código es requerido</p>
              }
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="fieldset">
                <label for="firstName" class="label">
                  <span class="label-text font-medium">Nombres</span>
                </label>
                <input id="firstName" class="input input-bordered w-full" formControlName="firstName" />
              </div>
              <div class="fieldset">
                <label for="fatherName" class="label">
                  <span class="label-text font-medium">Apellidos</span>
                </label>
                <input id="fatherName" class="input input-bordered w-full" formControlName="fatherName" />
              </div>
            </div>

            <div class="fieldset">
              <label for="documentId" class="label">
                <span class="label-text font-medium">Documento de identidad</span>
              </label>
              <input id="documentId" class="input input-bordered w-full" formControlName="documentId" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="fieldset">
                <label for="phone" class="label">
                  <span class="label-text font-medium">Teléfono</span>
                </label>
                <input id="phone" class="input input-bordered w-full" formControlName="phone" />
              </div>
              <div class="fieldset">
                <label for="email" class="label">
                  <span class="label-text font-medium">Correo</span>
                </label>
                <input id="email" type="email" class="input input-bordered w-full" formControlName="email" />
              </div>
            </div>

            <div class="fieldset">
              <label for="relationship" class="label">
                <span class="label-text font-medium">Parentesco</span>
              </label>
              <select id="relationship" class="select select-bordered w-full" formControlName="relationship">
                <option value="PARENT">Padre/Madre</option>
                <option value="GUARDIAN">Tutor legal</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>

            @if (errorMessage()) {
              <div class="alert alert-error">
                <span class="material-symbols-outlined">error</span>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <div class="pt-2 space-y-3">
              <button type="submit" class="btn btn-primary w-full" [disabled]="loading()">
                @if (loading()) {
                  <span class="loading loading-spinner loading-sm"></span>
                  Vinculando...
                } @else {
                  <span class="material-symbols-outlined">link</span>
                  Vincular cuenta
                }
              </button>
              <button type="button" class="btn btn-ghost btn-sm w-full" (click)="goBack()">
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
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VerifyParent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private toasts = inject(Toast);
  private auth = inject(Auth);

  public schoolId = signal('');
  public schoolName = signal('');
  public loading = signal(false);
  public errorMessage = signal('');

  public form = this.fb.group({
    enrollmentCode: ['', [Validators.required]],
    firstName: ['', [Validators.required]],
    fatherName: ['', [Validators.required]],
    documentId: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    relationship: ['PARENT', [Validators.required]],
  });

  ngOnInit() {
    this.schoolId.set(this.route.snapshot.queryParamMap.get('schoolId') || '');
    this.schoolName.set(this.route.snapshot.queryParamMap.get('schoolName') || '');
  }

  link() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const raw = this.form.getRawValue();
    const payload = {
      enrollmentCode: raw.enrollmentCode.trim().toUpperCase(),
      firstName: raw.firstName,
      fatherName: raw.fatherName,
      documentId: raw.documentId,
      phone: raw.phone,
      email: raw.email,
      relationship: raw.relationship,
    };

    this.http
      .post<{ status?: string; message?: string }>('/api/v1/auth/link-child', payload)
      .subscribe({
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
