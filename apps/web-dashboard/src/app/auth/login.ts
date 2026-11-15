import { Alert, Button, Loader, Toast, UiField, UiInput } from '#/ui';
import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { NonNullableFormBuilder } from '@angular/forms';
import { email, form, FormField, minLength, required } from '@angular/forms/signals';
import { ActivatedRoute, RouterLink } from '@angular/router';
import Auth from './auth';

@Component({
  selector: 'app-login',
  imports: [Alert, UiField, UiInput, Button, FormField, Loader, RouterLink],

  template: ` <div class="min-h-screen main">
    @defer {
      <div class="grid lg:grid-cols-5 min-h-screen">
        <!-- Brand panel -->
        <div
          class="brand-panel relative overflow-hidden lg:col-span-2 flex flex-col justify-between px-8 sm:px-12 py-10 lg:py-14 min-h-[300px] lg:min-h-screen"
        >
          <div class="absolute inset-0 dot-grid opacity-60 pointer-events-none"></div>

          <!-- decorative floating badges (desktop only) -->
          <div class="hidden lg:block absolute top-24 right-10 brand-float">
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
              <circle cx="16" cy="20" r="2.6" fill="var(--brand-navy-700)" />
              <circle cx="24" cy="20" r="2.6" fill="var(--brand-navy-700)" />
              <rect x="18" y="5" width="4" height="6" rx="2" fill="white" />
            </svg>
            <span class="font-semibold text-xl tracking-tight text-white">Skooltrak</span>
          </div>

          <!-- Headline -->
          <div class="relative z-10 max-w-sm mt-10 lg:mt-0">
            <h1 class="text-3xl sm:text-4xl font-semibold text-white leading-tight">
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
            <h2 class="text-2xl font-semibold text-ink-strong">Bienvenido de nuevo</h2>
            <p class="text-ink-muted mt-1.5 mb-8 text-sm">Inicia sesión para continuar en tu cuenta.</p>
            @if (passwordResetSuccess()) {
              <div uiAlert tone="success" class="mb-4">
                <span class="material-symbols-outlined">check_circle</span>
                <span>Tu contraseña ha sido actualizada. Ya puedes iniciar sesión.</span>
              </div>
            }
            <form class="space-y-5" (submit)="onSubmit($event)">
              <ui-field label="Correo electrónico" [field]="form.email">
                <input
                  uiInput
                  id="email"
                  [formField]="form.email"
                  type="email"
                  placeholder="tu@correo.com"
                  class="field-input rounded-xl h-12 px-4 pr-11 text-sm"
                />
              </ui-field>

              <div>
                <div class="flex items-center justify-between pb-1.5">
                  <label class="text-sm font-medium text-ink-strong" for="password">Contraseña</label>
                  <a routerLink="/forgot-password" class="link-brand text-xs font-medium no-underline hover:underline"
                    >¿Olvidaste tu contraseña?</a
                  >
                </div>
                <div class="relative">
                  <input
                    uiInput
                    #passwordInput
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    [formField]="form.password"
                    class="field-input rounded-xl h-12 px-4 pr-11 text-sm"
                  />
                  <button
                    type="button"
                    (click)="togglePassword()"
                    aria-label="Mostrar contraseña"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-strong cursor-pointer"
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

              <button uiButton variant="primary" size="lg" type="submit" class="w-full mt-2 text-sm">
                Iniciar sesión
              </button>

              <div class="divider text-ink-muted text-xs my-5">o</div>

              <a uiButton size="lg" routerLink="/auth/magic-link" class="w-full text-sm"> Acceso sin contraseña </a>
            </form>

            <p class="text-center text-sm text-ink-muted mt-8">
              ¿No tienes cuenta?
              <a routerLink="/register" class="link-brand font-medium no-underline hover:underline">Regístrate aquí</a>
            </p>

            <p class="lg:hidden text-center text-xs text-ink-muted mt-10">
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
    .main {
      color: var(--ui-ink-strong);
      background: var(--ui-surface-1);
    }

    /* Brand panel: a fixed navy-to-violet band in both themes (not school-branded). */
    .brand-panel {
      --brand-navy-900: #0f1e3b;
      --brand-navy-700: #1e3a6e;
      --brand-violet-600: #5f4fd6;
      background:
        radial-gradient(circle at 15% 20%, rgba(255, 255, 255, 0.1), transparent 40%),
        linear-gradient(155deg, var(--brand-navy-900) 0%, var(--brand-navy-700) 45%, var(--brand-violet-600) 100%);
    }
    .dot-grid {
      background-image: radial-gradient(rgba(255, 255, 255, 0.16) 1px, transparent 1px);
      background-size: 22px 22px;
    }
    .brand-float {
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
      .brand-float {
        animation: none;
      }
    }

    .field-input {
      background: var(--ui-surface-1);
      border: 1px solid var(--ui-line-strong);
      color: var(--ui-ink-strong);
      transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease;
    }
    .field-input::placeholder {
      color: var(--ui-ink-subtle);
    }
    .field-input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 22%, transparent);
    }

    a.link-brand {
      color: var(--color-primary);
    }
    a.link-brand:hover {
      color: var(--ui-ink-strong);
    }

    :focus-visible {
      outline: 2px solid var(--color-primary);
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
