import { Alert, BrandLogo, Button, Loader, Toast, UiField, UiInput } from '#/ui';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { email, form, FormField, minLength, required } from '@angular/forms/signals';
import { ActivatedRoute, RouterLink } from '@angular/router';
import Auth from './auth';
import { LoginBackdrop, LoginHero } from './login-hero';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, BrandLogo, Button, FormField, Loader, LoginBackdrop, LoginHero, RouterLink, UiField, UiInput],
  template: `
    <div class="login">
      @defer {
        <app-login-backdrop />

        <div class="shell">
          <header class="top enter" style="--d: 0s">
            <ui-brand-logo class="brand" />
            <a routerLink="/register" class="top-cta">
              <span class="top-cta-hint">¿Nuevo en Skooltrak?</span>
              Crear cuenta
            </a>
          </header>

          <main class="main">
            <app-login-hero />

            <section class="panel-wrap enter" style="--d: 0.2s">
              <div class="panel">
                <p class="eyebrow"><span class="pulse"></span>Acceso seguro</p>
                <h2 class="panel-title">Bienvenido de nuevo</h2>
                <p class="panel-sub">Inicia sesión para continuar en tu cuenta.</p>

                @if (passwordResetSuccess()) {
                  <div uiAlert tone="success" class="mt-6">
                    <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
                    <span>Tu contraseña ha sido actualizada. Ya puedes iniciar sesión.</span>
                  </div>
                }

                <form class="form" novalidate (submit)="onSubmit($event)">
                  <ui-field label="Correo electrónico" [field]="form.email">
                    <div class="control">
                      <svg class="ico control-ico" viewBox="0 0 24 24" aria-hidden="true">
                        <rect x="3" y="5" width="18" height="14" rx="2.5" />
                        <path d="m3.5 7.5 8.5 6 8.5-6" />
                      </svg>
                      <input
                        uiInput
                        size="lg"
                        type="email"
                        autocomplete="email"
                        placeholder="tu@correo.com"
                        class="control-input"
                        [formField]="form.email"
                      />
                      <span class="beam" aria-hidden="true"></span>
                    </div>
                  </ui-field>

                  <div class="password">
                    <ui-field label="Contraseña" [field]="form.password">
                      <div class="control">
                        <svg class="ico control-ico" viewBox="0 0 24 24" aria-hidden="true">
                          <rect x="4" y="11" width="16" height="10" rx="2.5" />
                          <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
                        </svg>
                        <input
                          uiInput
                          size="lg"
                          [type]="showPassword() ? 'text' : 'password'"
                          autocomplete="current-password"
                          placeholder="••••••••"
                          class="control-input control-input-pw"
                          [formField]="form.password"
                        />
                        <span class="beam" aria-hidden="true"></span>
                        <button
                          uiButton
                          variant="ghost"
                          iconOnly
                          type="button"
                          class="eye"
                          [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                          [attr.aria-pressed]="showPassword()"
                          (click)="showPassword.set(!showPassword())"
                        >
                          @if (showPassword()) {
                            <svg class="ico" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M3 3l18 18" />
                              <path
                                d="M10.6 5.1A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7c1.9 0 3.6-.6 5-1.4"
                              />
                              <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                            </svg>
                          } @else {
                            <svg class="ico" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          }
                        </button>
                      </div>
                    </ui-field>
                    <a routerLink="/forgot-password" class="lg-link forgot">¿Olvidaste tu contraseña?</a>
                  </div>

                  <button uiButton variant="primary" size="lg" type="submit" class="cta w-full" [loading]="loading()">
                    @if (loading()) {
                      Verificando…
                    } @else {
                      Iniciar sesión
                      <svg class="ico arrow" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    }
                  </button>

                  <div class="or-divider">o</div>

                  <a uiButton size="lg" routerLink="/auth/magic-link" class="alt w-full">
                    <svg class="ico" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 11.5 21 4l-7.5 18-2.7-7.8L3 11.5Z" />
                      <path d="m10.8 14.2 4.4-4.4" />
                    </svg>
                    Acceso sin contraseña
                  </a>
                </form>

                <p class="signup">
                  ¿No tienes cuenta?
                  <a routerLink="/register" class="lg-link"
                    >Regístrate aquí
                    <svg class="ico arrow" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </a>
                </p>

                <div class="panel-foot">
                  <svg class="ico" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3Z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  Conexión cifrada · Sesión protegida
                </div>
              </div>
            </section>
          </main>

          <footer class="foot enter" style="--d: 0.45s">© 2026 Skooltrak. Todos los derechos reservados.</footer>
        </div>
      } @placeholder {
        <lib-loader />
      } @error {
        <div>Error loading login</div>
      }
    </div>
  `,
  styles: `
    /* Colours come from the theme tokens (libs/ui/src/styles/theme.css), so the page follows the
     * user's light/dark theme and the school's primary colour. The --lg-* properties are shared
     * with app-login-hero; only glow strength and glass opacity differ per theme. */
    :host {
      display: block;
      --lg-accent: var(--color-primary);
      --lg-accent-ink: color-mix(in oklab, var(--color-primary) 72%, var(--ui-ink-strong));
      --lg-teal: oklch(72% 0.14 182);
      --lg-glow-a: 24%;
      --lg-glow-b: 18%;
      --lg-glass: color-mix(in oklab, var(--ui-surface-1) 80%, transparent);
      --lg-chip: color-mix(in oklab, var(--ui-surface-1) 90%, transparent);
      --lg-shadow: rgb(11 20 48 / 0.3);
      --lg-mono: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    :host-context([data-theme='dark']) {
      --lg-glow-a: 50%;
      --lg-glow-b: 22%;
      --lg-glass: color-mix(in oklab, var(--ui-surface-1) 66%, transparent);
      --lg-chip: color-mix(in oklab, var(--ui-surface-1) 82%, transparent);
      --lg-shadow: rgb(0 0 0 / 0.55);
    }
    @media (prefers-color-scheme: dark) {
      :host-context(html:not([data-theme])) {
        --lg-glow-a: 50%;
        --lg-glow-b: 22%;
        --lg-glass: color-mix(in oklab, var(--ui-surface-1) 66%, transparent);
        --lg-chip: color-mix(in oklab, var(--ui-surface-1) 82%, transparent);
        --lg-shadow: rgb(0 0 0 / 0.55);
      }
    }

    .login {
      position: relative;
      min-height: 100vh;
      overflow: hidden;
      isolation: isolate;
      background: var(--ui-surface-0);
      color: var(--ui-ink-strong);
    }

    /* Shell */
    .shell {
      max-width: 80rem;
      min-height: 100vh;
      margin: 0 auto;
      box-sizing: border-box;
      padding: 1.75rem 3rem;
      display: flex;
      flex-direction: column;
    }
    .top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .brand {
      height: 2.25rem;
    }
    .top-cta {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      min-height: 2.75rem;
      padding: 0 1rem;
      border-radius: 9999px;
      border: 1px solid var(--ui-line-strong);
      background: var(--lg-chip);
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--ui-ink-strong);
      text-decoration: none;
      transition: border-color 0.3s var(--ui-ease);
    }
    .top-cta:hover {
      border-color: var(--lg-accent);
    }
    .top-cta-hint {
      color: var(--ui-ink-muted);
    }
    .main {
      flex: 1;
      display: grid;
      grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
      gap: 4rem;
      align-items: center;
      padding: 1.75rem 0;
    }
    .foot {
      font: 400 0.75rem/1.4 var(--lg-mono);
      color: var(--ui-ink-muted);
    }

    /* Card, with a light that travels around its border */
    .panel-wrap {
      position: relative;
      justify-self: end;
      width: 100%;
      max-width: 27.5rem;
      padding: 1px;
      border-radius: 1.5rem;
      background: var(--ui-line-strong);
      box-shadow:
        0 30px 80px -36px var(--lg-shadow),
        0 40px 110px -50px color-mix(in oklab, var(--lg-accent) 55%, transparent);
    }
    .panel-wrap::before {
      content: '';
      position: absolute;
      inset: 0;
      padding: 1px;
      border-radius: inherit;
      background: conic-gradient(
        from var(--login-angle),
        transparent 0 60%,
        var(--lg-accent) 78%,
        var(--lg-teal) 86%,
        transparent 94%
      );
      mask:
        linear-gradient(#000 0 0) content-box,
        linear-gradient(#000 0 0);
      mask-composite: exclude;
      animation: rotate 6s linear infinite;
      pointer-events: none;
    }
    .panel {
      padding: 2.5rem 2.25rem 1.75rem;
      border-radius: calc(1.5rem - 1px);
      background: var(--lg-glass);
      backdrop-filter: blur(24px) saturate(150%);
    }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 0.625rem;
      margin: 0;
      font: 500 0.75rem/1 var(--lg-mono);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--ui-ink);
    }
    .pulse {
      position: relative;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--lg-accent);
    }
    .pulse::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: var(--lg-accent);
      animation: ping 2s var(--ui-ease) infinite;
    }
    .panel-title {
      margin: 1rem 0 0;
      font-size: 1.75rem;
      line-height: 1.15;
      letter-spacing: -0.03em;
      font-weight: 600;
    }
    .panel-sub {
      margin: 0.5rem 0 0;
      font-size: 0.9375rem;
      color: var(--ui-ink-muted);
    }
    .form {
      display: flex;
      flex-direction: column;
      gap: 1.125rem;
      margin-top: 1.75rem;
    }

    /* uiInput plus a leading icon, a focus glow and a beam underneath */
    .control {
      position: relative;
      display: flex;
      align-items: center;
    }
    .control-ico {
      position: absolute;
      left: 0.95rem;
      z-index: 1;
      color: var(--ui-ink-subtle);
      pointer-events: none;
    }
    .control:focus-within .control-ico {
      color: var(--lg-accent-ink);
    }
    .control-input {
      padding-inline-start: 2.75rem;
      transition: box-shadow 0.3s var(--ui-ease);
    }
    .control-input-pw {
      padding-inline-end: 3.25rem;
    }
    .control-input:focus {
      box-shadow:
        0 0 0 4px color-mix(in oklab, var(--lg-accent) 18%, transparent),
        0 10px 28px -14px var(--lg-accent);
    }
    .beam {
      position: absolute;
      inset: auto 0.75rem 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--lg-accent), var(--lg-teal), transparent);
      transform: scaleX(0);
      transition: transform 0.6s var(--ui-ease);
      pointer-events: none;
    }
    .control:focus-within .beam {
      transform: scaleX(1);
    }
    .eye {
      position: absolute;
      right: 0.25rem;
      z-index: 1;
      color: var(--ui-ink-muted);
    }
    .ico {
      width: 18px;
      height: 18px;
      flex: none;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.75;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .password {
      position: relative;
    }
    .forgot {
      position: absolute;
      top: 0;
      right: 0;
      font-size: 0.8125rem;
      line-height: 1.25rem;
    }
    .lg-link {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-weight: 500;
      color: var(--lg-accent-ink);
      text-decoration: none;
    }
    .lg-link:hover {
      color: var(--ui-ink-strong);
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    /* uiButton primary plus a glow and a light sweep on hover */
    .cta {
      position: relative;
      overflow: hidden;
      margin-top: 0.375rem;
      box-shadow: 0 12px 30px -12px var(--lg-accent);
    }
    .cta::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(110deg, transparent 30%, rgb(255 255 255 / 0.3) 50%, transparent 70%);
      transform: translateX(-120%);
      pointer-events: none;
    }
    .cta:hover::after {
      transform: translateX(120%);
      transition: transform 0.9s var(--ui-ease);
    }
    .arrow {
      transition: transform 0.3s var(--ui-ease);
    }
    .cta:hover .arrow,
    .lg-link:hover .arrow {
      transform: translateX(3px);
    }
    .lg-link .arrow,
    .panel-foot .ico {
      width: 15px;
      height: 15px;
    }
    .alt .ico {
      color: var(--lg-accent-ink);
    }

    .or-divider {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      font: 500 0.6875rem/1 var(--lg-mono);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--ui-ink-muted);
    }
    .or-divider::before,
    .or-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--ui-line-strong);
    }
    .signup {
      margin: 1.375rem 0 0;
      text-align: center;
      font-size: 0.875rem;
      color: var(--ui-ink-muted);
    }
    .panel-foot {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1.5rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--ui-line);
      font: 400 0.75rem/1.3 var(--lg-mono);
      color: var(--ui-ink-muted);
    }

    :focus-visible {
      outline: 2px solid var(--lg-accent);
      outline-offset: 2px;
    }

    .enter {
      opacity: 0;
      transform: translateY(16px);
      animation: up 0.9s var(--ui-ease) forwards;
      animation-delay: var(--d, 0s);
    }

    @property --login-angle {
      syntax: '<angle>';
      initial-value: 0deg;
      inherits: false;
    }
    @keyframes up {
      to {
        opacity: 1;
        transform: none;
      }
    }
    @keyframes ping {
      to {
        transform: scale(3);
        opacity: 0;
      }
    }
    @keyframes rotate {
      to {
        --login-angle: 360deg;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .login *,
      .login *::before,
      .login *::after {
        animation: none !important;
        transition: none !important;
      }
      .enter {
        opacity: 1;
        transform: none;
      }
    }

    @media (max-width: 1024px) {
      .main {
        grid-template-columns: minmax(0, 1fr);
        justify-items: center;
        gap: 1.75rem;
        padding: 2.25rem 0 1.75rem;
      }
      .panel-wrap {
        justify-self: center;
      }
    }
    @media (max-width: 560px) {
      .shell {
        padding: 1.25rem 1rem;
      }
      .top-cta-hint {
        display: none;
      }
      .main {
        gap: 1.375rem;
        padding: 1.75rem 0 1.25rem;
      }
      .panel {
        padding: 1.875rem 1.25rem 1.375rem;
      }
      .panel-title {
        font-size: 1.5rem;
      }
      .foot {
        text-align: center;
      }
    }
  `,
})
export default class Login {
  private auth = inject(Auth);
  private route = inject(ActivatedRoute);
  private toasts = inject(Toast);

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
  public showPassword = signal(false);
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
      this.form.email().markAsTouched();
      this.form.password().markAsTouched();
      this.toasts.showError('Llenar todos los campos');
      return;
    }
    const { email, password } = this.form().value();
    this.loading.set(true);
    await this.auth.signIn(email, password);
    this.loading.set(false);
  }
}
