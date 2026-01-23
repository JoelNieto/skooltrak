import { Loader, markGroupDirty, Toast } from '@/ui';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, Loader, RouterLink],
  template: `
    <div class="gradient-bg min-h-screen flex items-center justify-center p-4">
      @defer {
      <div class="max-w-lg w-full flex flex-col gap-8 items-center">
        <div><img src="skooltrak.png" alt="" class="h-12" /></div>

        <div class="w-full rounded-2xl shadow-xl overflow-hidden flex flex-col">
          <!-- Header Section -->
          <div class="bg-primary p-6 text-white text-center">
            <h1 class="text-2xl font-bold">Registra tu Escuela</h1>
            <p class="text-primary-content mt-2">Crea tu escuela y comienza a gestionar tu institución</p>
          </div>

          <!-- Steps indicator -->
          <div class="bg-base-200 px-6 py-4">
            <ul class="steps steps-horizontal w-full">
              <li class="step" [class.step-primary]="currentStep() >= 1">Escuela</li>
              <li class="step" [class.step-primary]="currentStep() >= 2">Administrador</li>
            </ul>
          </div>

          <!-- Form Section -->
          <div class="p-8 bg-base-100">
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
              <!-- Step 1: School -->
              @if (currentStep() === 1) {
              <div class="space-y-4" formGroupName="school">
                <p class="text-sm text-base-content/70 mb-4">
                  Ingresa los datos de tu institución educativa. Podrás agregar más detalles después.
                </p>

                <div class="fieldset">
                  <label for="schoolName">Nombre de la Escuela</label>
                  <input
                    type="text"
                    id="schoolName"
                    class="input input-primary w-full"
                    placeholder="Escuela Primaria Central"
                    formControlName="name"
                  />
                  @if (form.get('school.name')?.touched && form.get('school.name')?.hasError('required')) {
                  <p class="text-error text-xs mt-1">El nombre de la escuela es requerido</p>
                  }
                </div>

                <div class="fieldset">
                  <label for="schoolShortName">Nombre Corto / Siglas</label>
                  <input
                    type="text"
                    id="schoolShortName"
                    class="input input-primary w-full"
                    placeholder="EPC"
                    formControlName="shortName"
                  />
                  @if (form.get('school.shortName')?.touched && form.get('school.shortName')?.hasError('required')) {
                  <p class="text-error text-xs mt-1">El nombre corto es requerido</p>
                  }
                  <p class="text-xs text-base-content/60 mt-1">Se usará para identificar rápidamente tu escuela</p>
                </div>
              </div>
              }

              <!-- Step 2: Admin User Details -->
              @if (currentStep() === 2) {
              <div class="space-y-4" formGroupName="user">
                <p class="text-sm text-base-content/70 mb-4">
                  Crea tu cuenta de administrador para gestionar la escuela.
                </p>

                <div class="fieldset">
                  <label for="email">Correo Electrónico</label>
                  <input
                    type="email"
                    id="email"
                    class="input input-primary w-full"
                    placeholder="tu@email.com"
                    formControlName="email"
                  />
                  @if (form.get('user.email')?.touched && form.get('user.email')?.hasError('required')) {
                  <p class="text-error text-xs mt-1">El correo electrónico es requerido</p>
                  } @if (form.get('user.email')?.touched && form.get('user.email')?.hasError('email')) {
                  <p class="text-error text-xs mt-1">Ingresa un correo electrónico válido</p>
                  }
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="fieldset">
                    <label for="firstName">Nombre</label>
                    <input
                      type="text"
                      id="firstName"
                      class="input input-primary w-full"
                      placeholder="Juan"
                      formControlName="firstName"
                    />
                    @if (form.get('user.firstName')?.touched && form.get('user.firstName')?.hasError('required')) {
                    <p class="text-error text-xs mt-1">El nombre es requerido</p>
                    }
                  </div>

                  <div class="fieldset">
                    <label for="lastName">Apellido</label>
                    <input
                      type="text"
                      id="lastName"
                      class="input input-primary w-full"
                      placeholder="Pérez"
                      formControlName="lastName"
                    />
                    @if (form.get('user.lastName')?.touched && form.get('user.lastName')?.hasError('required')) {
                    <p class="text-error text-xs mt-1">El apellido es requerido</p>
                    }
                  </div>
                </div>

                <div class="fieldset">
                  <label for="password">Contraseña</label>
                  <input
                    type="password"
                    id="password"
                    class="input input-primary w-full"
                    placeholder="••••••••"
                    formControlName="password"
                  />
                  @if (form.get('user.password')?.touched && form.get('user.password')?.hasError('required')) {
                  <p class="text-error text-xs mt-1">La contraseña es requerida</p>
                  } @if (form.get('user.password')?.touched && form.get('user.password')?.hasError('minlength')) {
                  <p class="text-error text-xs mt-1">La contraseña debe tener al menos 8 caracteres</p>
                  }
                </div>

                <div class="fieldset">
                  <label for="confirmPassword">Confirmar Contraseña</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    class="input input-primary w-full"
                    placeholder="••••••••"
                    formControlName="confirmPassword"
                  />
                  @if (form.get('user.confirmPassword')?.touched && form.get('user.confirmPassword')?.hasError('required')) {
                  <p class="text-error text-xs mt-1">Confirma tu contraseña</p>
                  } @if (form.get('user')?.hasError('passwordMismatch') && form.get('user.confirmPassword')?.touched) {
                  <p class="text-error text-xs mt-1">Las contraseñas no coinciden</p>
                  }
                </div>
              </div>
              }

              <!-- Navigation Buttons -->
              <div class="flex justify-between gap-4 pt-4">
                @if (currentStep() > 1) {
                <button type="button" class="btn btn-outline" (click)="previousStep()">Anterior</button>
                } @else {
                <div></div>
                } @if (currentStep() < 2) {
                <button type="button" class="btn btn-primary" (click)="nextStep()">Siguiente</button>
                } @else {
                <button type="submit" class="btn btn-primary" [disabled]="loading()">
                  @if (loading()) {
                  <span class="loading loading-spinner loading-sm"></span>
                  Creando escuela...
                  } @else {
                  Crear Escuela
                  }
                </button>
                }
              </div>
            </form>

            <div class="divider">o</div>

            <p class="text-center text-sm">
              ¿Ya tienes cuenta?
              <a routerLink="/login" class="link link-primary">Inicia sesión</a>
            </p>
          </div>
        </div>

        <p class="text-base-200 text-center">2025 © Skooltrak. Todos los derechos reservados.</p>
      </div>
      } @placeholder {
      <lib-loader />
      } @error {
      <div>Error loading registration</div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Register {
  private fb = inject(NonNullableFormBuilder);
  private apollo = inject(Apollo);
  private router = inject(Router);
  private toasts = inject(Toast);

  public currentStep = signal(1);
  public loading = signal(false);

  public form = this.fb.group({
    school: this.fb.group({
      name: ['', [Validators.required]],
      shortName: ['', [Validators.required]],
    }),
    user: this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        firstName: ['', [Validators.required]],
        lastName: ['', [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    ),
  });

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password?.value !== confirmPassword?.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  public nextStep() {
    const currentStepGroup = this.getCurrentStepGroup();
    if (currentStepGroup?.invalid) {
      markGroupDirty(currentStepGroup as unknown as FormGroup<any>);
      this.toasts.showError('Por favor, completa todos los campos requeridos');
      return;
    }
    this.currentStep.update((step) => Math.min(step + 1, 2));
  }

  public previousStep() {
    this.currentStep.update((step) => Math.max(step - 1, 1));
  }

  private getCurrentStepGroup() {
    switch (this.currentStep()) {
      case 1:
        return this.form.get('school');
      case 2:
        return this.form.get('user');
      default:
        return null;
    }
  }

  public onSubmit() {
    if (this.form.invalid) {
      markGroupDirty(this.form);
      this.toasts.showError('Por favor, completa todos los campos requeridos');
      return;
    }

    this.loading.set(true);

    const { school, user } = this.form.getRawValue();

    this.apollo
      .mutate<{ signUp: { accessToken: string } }>({
        mutation: gql`
          mutation SignUp($input: SignUpInput!) {
            signUp(input: $input) {
              accessToken
            }
          }
        `,
        variables: {
          input: {
            schoolName: school.name,
            schoolShortName: school.shortName,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            password: user.password,
          },
        },
      })
      .subscribe({
        next: (res) => {
          const { accessToken } = res.data!.signUp;
          localStorage.setItem('access_token', accessToken);
          this.toasts.showSuccess('Escuela creada exitosamente');
          this.router.navigate(['/home']);
        },
        error: (err) => {
          console.error(err);
          this.loading.set(false);
          this.toasts.showError(err.message || 'Error al crear la escuela. Intenta de nuevo.');
        },
      });
  }
}
