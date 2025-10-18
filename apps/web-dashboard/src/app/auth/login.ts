import { Toast } from '@/ui';
import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Apollo, gql } from 'apollo-angular';

import { markGroupDirty } from '@/ui';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: ` <div
    class="gradient-bg min-h-screen flex items-center justify-center p-4"
  >
    @defer {
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
      <!-- Header Section -->
      <div class="bg-primary p-6 text-white text-center">
        <h1 class="text-2xl font-bold">Bienvenido</h1>
        <p class="text-primary-content mt-2">Inicia sesión para continuar</p>
      </div>

      <!-- Form Section -->
      <div class="p-8">
        <form
          id="loginForm"
          class="space-y-6"
          [formGroup]="form"
          (ngSubmit)="onSubmit()"
        >
          <!-- Email Field -->
          <div>
            <label
              for="email"
              class="block text-sm font-medium text-gray-700 mb-1"
              >Correo Electrónico</label
            >
            <div class="relative">
              <div
                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              >
                <i class="fas fa-envelope text-gray-400"></i>
              </div>
              <input
                type="email"
                id="email"
                name="email"
                class="input input-primary"
                placeholder="you@example.com"
                formControlName="email"
              />
            </div>
            @if(form.get('email')?.hasError('required')) {
            <p id="emailError" class="text-red-500 text-xs mt-1 hidden">
              Por favor, ingresa un correo electrónico válido
            </p>
            }
          </div>

          <!-- Password Field -->
          <div>
            <div class="flex justify-between items-center mb-1">
              <label
                for="password"
                class="block text-sm font-medium text-gray-700"
                >Contraseña</label
              >
              <a href="#" class="text-sm link link-primary"
                >¿Olvidaste tu contraseña?</a
              >
            </div>
            <div class="relative">
              <div
                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              >
                <i class="fas fa-lock text-gray-400"></i>
              </div>
              <input
                type="password"
                id="password"
                name="password"
                class="input input-primary"
                placeholder="••••••••"
                formControlName="password"
              />
              <button
                type="button"
                id="togglePassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <i
                  class="fas fa-eye text-gray-400 hover:text-gray-600 transition duration-200"
                ></i>
              </button>
            </div>
            @if(form.get('password')?.hasError('required')) {
            <p id="passwordError" class="text-red-500 text-xs mt-1 hidden">
              Por favor, ingresa una contraseña
            </p>
            }
          </div>

          <button type="submit" class="btn btn-primary w-full">
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
    } @placeholder {
    <div class="loader"></div>
    } @error {
    <div>Error loading login</div>
    }
  </div>`,
  styles: `.loader {
        width: 148px;
        height: 148px;
        border-radius: 50%;
        animation: rotate 1s linear infinite;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
  
      }
      .loader::before , .loader::after {
        content: "";
        box-sizing: border-box;
        position: absolute;
        inset: 0px;
        border-radius: 50%;
        border: 10px solid #FFF;
        border-color: var(--color-primary);
        animation: prixClipFix 2s linear infinite ;
      }
      .loader::after{
        border-color: var(--color-secondary);
        animation: prixClipFix 2s linear infinite , rotate 0.5s linear infinite reverse;
        inset: 12px;
      }

      @keyframes rotate {
        0%   {transform: rotate(0deg)}
        100%   {transform: rotate(360deg)}
      }

      @keyframes prixClipFix {
          0%   {clip-path:polygon(50% 50%,0 0,0 0,0 0,0 0,0 0)}
          25%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 0,100% 0,100% 0)}
          50%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,100% 100%,100% 100%)}
          75%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,0 100%,0 100%)}
          100% {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,0 100%,0 0)}
      }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Login {
  private apollo = inject(Apollo);
  private fb = inject(NonNullableFormBuilder);
  public form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });
  private toasts = inject(Toast);
  public loading = signal(false);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  public onSubmit() {
    if (this.form.invalid) {
      this.toasts.showError('Llenar todos los campos');
      markGroupDirty(this.form);
      return;
    }
    const { email, password } = this.form.value;
    this.loading.set(true);
    this.apollo
      .mutate<{ login: { accessToken: string } }>({
        mutation: gql`
          mutation Login($email: String!, $password: String!) {
            login(email: $email, password: $password) {
              accessToken
            }
          }
        `,
        variables: {
          email,
          password,
        },
      })
      .subscribe({
        next: (res) => {
          const { accessToken } = res.data!.login;

          if (!isPlatformBrowser(this.platformId)) {
            return;
          }
          localStorage.setItem('access_token', accessToken);
          this.loading.set(false);
          this.router.navigate(['/home']);
          this.toasts.showSuccess('Inicio de sesión exitoso');
        },
        error: (err) => {
          this.loading.set(false);
          this.toasts.showError(err.message);
        },
      });
  }
}
