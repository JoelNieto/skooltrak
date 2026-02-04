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
    @defer {
      <div class="min-h-screen flex flex-col gradient-bg">
        <!-- Fixed Header -->
        <header class="p-4 md:p-6 flex items-center justify-between">
          <img src="skooltrak.png" alt="Skooltrak" class="h-8 md:h-10" />
        </header>

        <!-- Scrollable Content -->
        <main class="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="w-full max-w-md">
            <div class="text-center space-y-8 animate-fade-in">
              <!-- Icon -->
              <div class="flex justify-center">
                <div class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <span class="material-symbols-outlined text-5xl text-primary">person_add</span>
                </div>
              </div>

              <!-- Title & Subtitle -->
              <div class="space-y-2">
                <h1 class="text-2xl md:text-3xl font-bold text-base-content">Crea tu Cuenta</h1>
                <p class="text-base-content/70">
                  Registra tu cuenta de administrador. Después podrás configurar tu escuela.
                </p>
              </div>

              <!-- Form Fields -->
              <div class="space-y-4 text-left">
                <div class="fieldset">
                  <label for="email" class="label">
                    <span class="label-text font-medium">Correo Electrónico</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    class="input input-bordered w-full"
                    placeholder="tu@email.com"
                    formControlName="email"
                  />
                  @if (form.get('email')?.touched && form.get('email')?.hasError('required')) {
                    <p class="text-error text-xs mt-1">El correo electrónico es requerido</p>
                  } @else if (form.get('email')?.touched && form.get('email')?.hasError('email')) {
                    <p class="text-error text-xs mt-1">Ingresa un correo electrónico válido</p>
                  }
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="fieldset">
                    <label for="firstName" class="label">
                      <span class="label-text font-medium">Nombre</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      class="input input-bordered w-full"
                      placeholder="Juan"
                      formControlName="firstName"
                    />
                    @if (form.get('firstName')?.touched && form.get('firstName')?.hasError('required')) {
                      <p class="text-error text-xs mt-1">Requerido</p>
                    }
                  </div>

                  <div class="fieldset">
                    <label for="lastName" class="label">
                      <span class="label-text font-medium">Apellido</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      class="input input-bordered w-full"
                      placeholder="Pérez"
                      formControlName="lastName"
                    />
                    @if (form.get('lastName')?.touched && form.get('lastName')?.hasError('required')) {
                      <p class="text-error text-xs mt-1">Requerido</p>
                    }
                  </div>
                </div>

                <div class="fieldset">
                  <label for="password" class="label">
                    <span class="label-text font-medium">Contraseña</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    class="input input-bordered w-full"
                    placeholder="••••••••"
                    formControlName="password"
                  />
                  @if (form.get('password')?.touched && form.get('password')?.hasError('required')) {
                    <p class="text-error text-xs mt-1">La contraseña es requerida</p>
                  } @else if (form.get('password')?.touched && form.get('password')?.hasError('minlength')) {
                    <p class="text-error text-xs mt-1">Mínimo 8 caracteres</p>
                  }
                </div>

                <div class="fieldset">
                  <label for="confirmPassword" class="label">
                    <span class="label-text font-medium">Confirmar Contraseña</span>
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    class="input input-bordered w-full"
                    placeholder="••••••••"
                    formControlName="confirmPassword"
                  />
                  @if (form.get('confirmPassword')?.touched && form.get('confirmPassword')?.hasError('required')) {
                    <p class="text-error text-xs mt-1">Confirma tu contraseña</p>
                  } @else if (form.hasError('passwordMismatch') && form.get('confirmPassword')?.touched) {
                    <p class="text-error text-xs mt-1">Las contraseñas no coinciden</p>
                  }
                </div>
              </div>

              <div class="pt-4">
                <button type="submit" class="btn btn-primary w-full" [disabled]="loading()">
                  @if (loading()) {
                    <span class="loading loading-spinner loading-sm"></span>
                    Creando cuenta...
                  } @else {
                    Crear Cuenta
                    <span class="material-symbols-outlined text-xl">arrow_forward</span>
                  }
                </button>
              </div>
            </div>
          </form>

          <!-- Login Link (centered below form) -->
          <div class="mt-8 text-center">
            <p class="text-sm text-base-content/70">
              ¿Ya tienes cuenta?
              <a routerLink="/login" class="link link-primary font-medium">Inicia sesión</a>
            </p>
          </div>
        </main>

        <!-- Fixed Footer -->
        <footer class="p-4 md:p-6 flex justify-center border-t border-base-200 bg-base-100/80 backdrop-blur-sm">
          <p class="text-sm text-base-content/60">2025 © Skooltrak. Todos los derechos reservados.</p>
        </footer>
      </div>
    } @placeholder {
      <div class="min-h-screen flex items-center justify-center gradient-bg">
        <lib-loader />
      </div>
    }
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Register {
  private fb = inject(NonNullableFormBuilder);
  private apollo = inject(Apollo);
  private router = inject(Router);
  private toasts = inject(Toast);

  public loading = signal(false);

  public form = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordMatchValidator },
  );

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password?.value !== confirmPassword?.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  public onSubmit() {
    if (this.form.invalid) {
      markGroupDirty(this.form as FormGroup);
      this.toasts.showError('Por favor, completa todos los campos requeridos');
      return;
    }

    this.loading.set(true);

    const { email, firstName, lastName, password } = this.form.getRawValue();

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
            email,
            firstName,
            lastName,
            password,
          },
        },
      })
      .subscribe({
        next: (res) => {
          const { accessToken } = res.data!.signUp;
          localStorage.setItem('access_token', accessToken);
          this.toasts.showSuccess('Cuenta creada. Verifica tu correo electrónico.');
          // Redirect to email verification page
          this.router.navigate(['/verify-email']);
        },
        error: (err) => {
          console.error(err);
          this.loading.set(false);
          this.toasts.showError(err.message || 'Error al crear la cuenta. Intenta de nuevo.');
        },
      });
  }
}
