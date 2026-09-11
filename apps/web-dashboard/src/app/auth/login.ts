import { Loader, Toast } from '#/ui';
import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { NonNullableFormBuilder } from '@angular/forms';
import { email, form, FormField, minLength, required } from '@angular/forms/signals';
import { ActivatedRoute, RouterLink } from '@angular/router';
import Auth from './auth';

@Component({
  selector: 'app-login',
  imports: [FormField, Loader, RouterLink],

  template: ` <div class="min-h-screen main">
    @defer {
      <div class="grid lg:grid-cols-5 min-h-screen">
        <!-- Brand panel -->
        <div
          class="brand-panel relative overflow-hidden lg:col-span-2 flex flex-col justify-between px-8 sm:px-12 py-10 lg:py-14 min-h-[300px] lg:min-h-screen"
        >
          <div class="absolute inset-0 dot-grid opacity-60 pointer-events-none"></div>

          <!-- decorative floating badges (desktop only) -->
          <div class="hidden lg:block absolute top-24 right-10 badge-float">
            <div
              class="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8">
                <path
                  d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>
          <div class="hidden lg:block absolute bottom-40 right-24 opacity-90">
            <div
              class="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M16 2v4M8 2v4M3 10h18" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
          </div>

          <!-- Logo / wordmark -->
          <div class="relative z-10 flex items-center gap-3">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="14" fill="white" fill-opacity="0.12" />
              <rect x="7" y="11" width="26" height="18" rx="9" fill="white" />
              <circle cx="16" cy="20" r="2.6" fill="var(--navy-700)" />
              <circle cx="24" cy="20" r="2.6" fill="var(--navy-700)" />
              <rect x="18" y="5" width="4" height="6" rx="2" fill="white" />
            </svg>
            <span class="font-display font-semibold text-xl text-white">Skooltrak</span>
          </div>

          <!-- Headline -->
          <div class="relative z-10 max-w-sm mt-10 lg:mt-0">
            <h1 class="font-display text-3xl sm:text-4xl font-semibold text-white leading-tight">
              Todo lo que pasa en la escuela, en un solo lugar.
            </h1>
            <p class="mt-4 text-white/75 text-base leading-relaxed">
              Calificaciones, avisos y mensajes entre familias y docentes, siempre a mano.
            </p>
          </div>

          <p class="relative z-10 hidden lg:block text-white/50 text-sm mt-10">
            © 2026 Skooltrak. Todos los derechos reservados.
          </p>
        </div>

        <!-- Form panel -->
        <div class="lg:col-span-3 flex items-center justify-center px-6 sm:px-10 py-12">
          <div class="w-full max-w-sm">
            <h2 class="font-display text-2xl font-semibold text-[var(--ink)]">Bienvenido de nuevo</h2>
            <p class="text-[var(--muted)] mt-1.5 mb-8 text-sm">Inicia sesión para continuar en tu cuenta.</p>
            @if (passwordResetSuccess()) {
              <div class="alert alert-success mb-4">
                <span class="material-symbols-outlined">check_circle</span>
                <span>Tu contraseña ha sido actualizada. Ya puedes iniciar sesión.</span>
              </div>
            }
            <form class="space-y-5" (submit)="onSubmit($event)">
              <div class="fieldset">
                <label class="label pb-1.5" for="email">
                  <span class="label-text text-[var(--ink)] font-medium text-sm">Correo electrónico</span>
                </label>
                <input
                  id="email"
                  [formField]="form.email"
                  type="email"
                  placeholder="tu@correo.com"
                  class="field-input input w-full rounded-xl h-12 px-4 pr-11 text-sm"
                />
              </div>

              <div class="form-control">
                <div class="flex items-center justify-between pb-1.5">
                  <label class="label p-0" for="password">
                    <span class="label-text text-[var(--ink)] font-medium text-sm">Contraseña</span>
                  </label>
                  <a routerLink="/forgot-password" class="link-brand text-xs font-medium no-underline hover:underline"
                    >¿Olvidaste tu contraseña?</a
                  >
                </div>
                <div class="relative">
                  <input
                    #passwordInput
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    [formField]="form.password"
                    class="field-input input w-full rounded-xl h-12 px-4 pr-11 text-sm"
                  />
                  <button
                    type="button"
                    (click)="togglePassword()"
                    aria-label="Mostrar contraseña"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--navy-700)] cursor-pointer"
                  >
                    <svg
                      id="eye-icon"
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.8"
                    >
                      <path
                        d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <circle cx="12" cy="12" r="3" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                class="btn-primary-custom btn border-0 w-full rounded-xl h-12 mt-2 mb-0 text-sm font-semibold"
              >
                Iniciar sesión
              </button>

              <div class="divider text-[var(--muted)] text-xs my-5">o</div>

              <a
                routerLink="/auth/magic-link"
                type="button"
                class="btn-ghost-custom btn w-full rounded-xl h-12 text-sm font-semibold"
              >
                Acceso sin contraseña
              </a>
            </form>

            <p class="text-center text-sm text-[var(--muted)] mt-8">
              ¿No tienes cuenta?
              <a routerLink="/register" class="link-brand font-medium no-underline hover:underline">Regístrate aquí</a>
            </p>

            <p class="lg:hidden text-center text-xs text-[var(--muted)] mt-10">
              © 2026 Skooltrak. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    } @placeholder {
      <lib-loader />
    } @error {
      <div>Error loading login</div>
    }
  </div>`,
  styles: `
    :root {
      --navy-900: #0f1e3b;
      --navy-700: #1e3a6e;
      --violet-600: #5f4fd6;
      --violet-500: #7f72e8;
      --amber-400: #f2a65a;
      --ink: #161a2e;
      --muted: #616a85;
      --surface: #fcfcfd;
      --line: #e3e6f0;
    }

    .main {
      font-family: 'Inter', sans-serif;
      color: var(--ink);
      background: var(--surface);
    }
    .font-display {
      font-family: 'Lexend', sans-serif;
    }

    .brand-panel {
      background:
        radial-gradient(circle at 15% 20%, rgba(255, 255, 255, 0.1), transparent 40%),
        linear-gradient(155deg, var(--navy-900) 0%, var(--navy-700) 45%, var(--violet-600) 100%);
    }
    .dot-grid {
      background-image: radial-gradient(rgba(255, 255, 255, 0.16) 1px, transparent 1px);
      background-size: 22px 22px;
    }
    .badge-float {
      animation: floaty 5s ease-in-out infinite;
    }
    @keyframes floaty {
      0%,
      100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-10px);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .badge-float {
        animation: none;
      }
    }

    .field-input {
      background: #fff;
      border: 1px solid var(--line);
      color: var(--ink);
      transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease;
    }
    .field-input:focus {
      outline: none;
      border-color: var(--violet-500);
      box-shadow: 0 0 0 3px rgba(127, 114, 232, 0.2);
    }
    .btn-primary-custom {
      background: linear-gradient(135deg, var(--navy-700), var(--violet-600));
      color: #fff;
      transition:
        filter 0.15s ease,
        transform 0.05s ease;
    }
    .btn-primary-custom:hover {
      filter: brightness(1.08);
    }
    .btn-primary-custom:active {
      transform: translateY(1px);
    }

    .btn-ghost-custom {
      background: #fff;
      border: 1.5px solid var(--line);
      color: var(--navy-700);
      transition:
        border-color 0.15s ease,
        background 0.15s ease;
    }
    .btn-ghost-custom:hover {
      border-color: var(--violet-500);
      background: #fafaff;
    }

    a.link-brand {
      color: var(--violet-600);
    }
    a.link-brand:hover {
      color: var(--navy-700);
    }

    :focus-visible {
      outline: 2px solid var(--violet-500);
      outline-offset: 2px;
    }
  `,
})
export default class Login {
  private fb = inject(NonNullableFormBuilder);
  private auth = inject(Auth);
  private route = inject(ActivatedRoute);
  private toasts = inject(Toast);
  passwordInput = viewChild.required<ElementRef<HTMLInputElement>>('passwordInput');

  private loginModel = signal({
    email: '',
    password: '',
  });

  public form = form(this.loginModel, (schemaPath) => {
    required(schemaPath.email, { message: 'El correo electrónico es requerido' });
    required(schemaPath.password, { message: 'La contraseña es requerida' });
    email(schemaPath.email, { message: 'El correo electrónico no es válido' });
    minLength(schemaPath.password, 6, { message: 'La contraseña debe tener al menos 6 caracteres' });
  });

  public loading = signal(false);
  public passwordResetSuccess = signal(false);

  constructor() {
    // Check for password reset success query param
    this.route.queryParams.subscribe((params) => {
      if (params['reset'] === 'success') {
        this.passwordResetSuccess.set(true);
      }
    });
  }

  public async onSubmit(event: Event) {
    event.preventDefault();
    if (this.form().invalid()) {
      this.toasts.showError('Llenar todos los campos');
      return;
    }
    const { email, password } = this.form().value();
    this.loading.set(true);
    await this.auth.signIn(email, password);
    this.loading.set(false);
  }

  togglePassword() {
    const input = this.passwordInput().nativeElement;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
  }
}
