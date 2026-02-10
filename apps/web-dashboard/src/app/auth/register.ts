import { Loader, markGroupDirty, Toast } from '@/ui';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
          @switch (step()) {
            @case ('email') {
              <!-- Step 1: Enter email -->
              <form [formGroup]="emailForm" (ngSubmit)="sendVerificationLink()" class="w-full max-w-md">
                <div class="text-center space-y-8 animate-fade-in">
                  <div class="flex justify-center">
                    <div class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <span class="material-symbols-outlined text-5xl text-primary">mail</span>
                    </div>
                  </div>

                  <div class="space-y-2">
                    <h1 class="text-2xl md:text-3xl font-bold text-base-content">Crea tu Cuenta</h1>
                    <p class="text-base-content/70">Ingresa tu correo electrónico para comenzar el registro.</p>
                  </div>

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
                      @if (emailForm.get('email')?.touched && emailForm.get('email')?.hasError('required')) {
                        <p class="text-error text-xs mt-1">El correo electrónico es requerido</p>
                      } @else if (emailForm.get('email')?.touched && emailForm.get('email')?.hasError('email')) {
                        <p class="text-error text-xs mt-1">Ingresa un correo electrónico válido</p>
                      }
                    </div>
                  </div>

                  <div class="pt-4">
                    <button type="submit" class="btn btn-primary w-full" [disabled]="loading()">
                      @if (loading()) {
                        <span class="loading loading-spinner loading-sm"></span>
                        Enviando...
                      } @else {
                        Enviar enlace de verificación
                        <span class="material-symbols-outlined text-xl">arrow_forward</span>
                      }
                    </button>
                  </div>
                </div>
              </form>
            }
            @case ('check-inbox') {
              <!-- Step 2: Check inbox -->
              <div class="w-full max-w-md text-center space-y-8 animate-fade-in">
                <div class="flex justify-center">
                  <div class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <span class="material-symbols-outlined text-5xl text-primary">mark_email_unread</span>
                  </div>
                </div>

                <div class="space-y-2">
                  <h1 class="text-2xl md:text-3xl font-bold text-base-content">Revisa tu Correo</h1>
                  <p class="text-base-content/70">
                    Te hemos enviado un enlace de verificación a <strong>{{ sentEmail() }}</strong>. Haz clic en el
                    enlace para continuar con el registro.
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
                    (click)="resendLink()"
                    [disabled]="loading() || cooldown() > 0"
                  >
                    @if (loading()) {
                      <span class="loading loading-spinner loading-sm"></span>
                      Enviando...
                    } @else if (cooldown() > 0) {
                      Reenviar en {{ cooldown() }}s
                    } @else {
                      <span class="material-symbols-outlined">refresh</span>
                      Reenviar enlace
                    }
                  </button>
                  <button class="btn btn-ghost btn-sm" (click)="step.set('email')">
                    <span class="material-symbols-outlined text-lg">arrow_back</span>
                    Cambiar correo electrónico
                  </button>
                </div>
              </div>
            }
            @case ('validating') {
              <!-- Validating token -->
              <div class="w-full max-w-md text-center space-y-8 animate-fade-in">
                <div class="flex justify-center">
                  <lib-loader />
                </div>
                <div class="space-y-2">
                  <h1 class="text-2xl md:text-3xl font-bold text-base-content">Verificando...</h1>
                  <p class="text-base-content/70">Validando tu enlace de verificación.</p>
                </div>
              </div>
            }
            @case ('register') {
              <!-- Step 3: Registration form -->
              <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="w-full max-w-md">
                <div class="text-center space-y-8 animate-fade-in">
                  <div class="flex justify-center">
                    <div class="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
                      <span class="material-symbols-outlined text-5xl text-success">check_circle</span>
                    </div>
                  </div>

                  <div class="space-y-2">
                    <h1 class="text-2xl md:text-3xl font-bold text-base-content">Completa tu Registro</h1>
                    <p class="text-base-content/70">
                      Tu correo <strong>{{ verifiedEmail() }}</strong> ha sido verificado. Completa los datos para crear
                      tu cuenta.
                    </p>
                  </div>

                  <div class="space-y-4 text-left">
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
                        @if (registerForm.get('firstName')?.touched && registerForm.get('firstName')?.hasError('required')) {
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
                        @if (registerForm.get('lastName')?.touched && registerForm.get('lastName')?.hasError('required')) {
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
                      @if (registerForm.get('password')?.touched && registerForm.get('password')?.hasError('required')) {
                        <p class="text-error text-xs mt-1">La contraseña es requerida</p>
                      } @else if (registerForm.get('password')?.touched && registerForm.get('password')?.hasError('minlength')) {
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
                      @if (
                        registerForm.get('confirmPassword')?.touched &&
                        registerForm.get('confirmPassword')?.hasError('required')
                      ) {
                        <p class="text-error text-xs mt-1">Confirma tu contraseña</p>
                      } @else if (registerForm.hasError('passwordMismatch') && registerForm.get('confirmPassword')?.touched) {
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
            }
            @case ('error') {
              <!-- Error state -->
              <div class="w-full max-w-md text-center space-y-8 animate-fade-in">
                <div class="flex justify-center">
                  <div class="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center">
                    <span class="material-symbols-outlined text-5xl text-error">error</span>
                  </div>
                </div>
                <div class="space-y-2">
                  <h1 class="text-2xl md:text-3xl font-bold text-base-content">Enlace Inválido</h1>
                  <p class="text-base-content/70">
                    {{ errorMessage() || 'El enlace de verificación es inválido o ha expirado.' }}
                  </p>
                </div>
                <button class="btn btn-primary" (click)="step.set('email')">
                  <span class="material-symbols-outlined">arrow_back</span>
                  Intentar de nuevo
                </button>
              </div>
            }
          }

          <!-- Login Link (centered below form) -->
          @if (step() === 'email' || step() === 'register') {
            <div class="mt-8 text-center">
              <p class="text-sm text-base-content/70">
                ¿Ya tienes cuenta?
                <a routerLink="/login" class="link link-primary font-medium">Inicia sesión</a>
              </p>
            </div>
          }
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
export default class Register implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private apollo = inject(Apollo);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toasts = inject(Toast);

  public step = signal<'email' | 'check-inbox' | 'validating' | 'register' | 'error'>('email');
  public loading = signal(false);
  public sentEmail = signal('');
  public verifiedEmail = signal('');
  public verifiedToken = signal('');
  public errorMessage = signal('');
  public cooldown = signal(0);
  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  public emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  public registerForm = this.fb.group(
    {
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

  ngOnInit() {
    // Check if there's a token in the URL (user clicked email link)
    const token = this.route.snapshot.queryParamMap.get('token');
    const email = this.route.snapshot.queryParamMap.get('email');

    if (token && email) {
      this.validateToken(token, email);
    }
  }

  private validateToken(token: string, email: string) {
    this.step.set('validating');

    this.apollo
      .query<{ validateEmailToken: boolean }>({
        query: gql`
          query ValidateEmailToken($token: String!, $email: String!) {
            validateEmailToken(token: $token, email: $email)
          }
        `,
        variables: { token, email },
        fetchPolicy: 'network-only',
      })
      .subscribe({
        next: (res) => {
          if (res.data?.validateEmailToken) {
            this.verifiedEmail.set(email);
            this.verifiedToken.set(token);
            this.step.set('register');
          } else {
            this.step.set('error');
          }
        },
        error: (err) => {
          this.errorMessage.set(err.message || 'El enlace de verificación es inválido o ha expirado.');
          this.step.set('error');
        },
      });
  }

  public sendVerificationLink() {
    if (this.emailForm.invalid) {
      markGroupDirty(this.emailForm as FormGroup);
      return;
    }

    this.loading.set(true);
    const email = this.emailForm.getRawValue().email;

    this.apollo
      .mutate<{ sendVerificationLink: boolean }>({
        mutation: gql`
          mutation SendVerificationLink($email: String!) {
            sendVerificationLink(email: $email)
          }
        `,
        variables: { email },
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.sentEmail.set(email);
          this.step.set('check-inbox');
          this.startCooldown();
        },
        error: (err) => {
          this.loading.set(false);
          this.toasts.showError(err.message || 'Error al enviar el enlace de verificación');
        },
      });
  }

  public resendLink() {
    if (this.cooldown() > 0) return;

    this.loading.set(true);
    const email = this.sentEmail();

    this.apollo
      .mutate<{ sendVerificationLink: boolean }>({
        mutation: gql`
          mutation SendVerificationLink($email: String!) {
            sendVerificationLink(email: $email)
          }
        `,
        variables: { email },
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.toasts.showSuccess('Enlace reenviado');
          this.startCooldown();
        },
        error: (err) => {
          this.loading.set(false);
          this.toasts.showError(err.message || 'Error al reenviar');
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

  public onSubmit() {
    if (this.registerForm.invalid) {
      markGroupDirty(this.registerForm as FormGroup);
      this.toasts.showError('Por favor, completa todos los campos requeridos');
      return;
    }

    this.loading.set(true);

    const { firstName, lastName, password } = this.registerForm.getRawValue();

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
            token: this.verifiedToken(),
            email: this.verifiedEmail(),
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
          this.toasts.showSuccess('Cuenta creada exitosamente');
          this.router.navigate(['/onboarding']);
        },
        error: (err) => {
          console.error(err);
          this.loading.set(false);
          this.toasts.showError(err.message || 'Error al crear la cuenta. Intenta de nuevo.');
        },
      });
  }
}
