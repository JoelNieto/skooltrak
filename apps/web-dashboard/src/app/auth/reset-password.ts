import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import Auth from './auth';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set new password
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Enter your new password below.
          </p>
        </div>

        @if (error()) {
          <div class="rounded-md bg-red-50 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-red-800">
                  Invalid or expired reset link. Please request a new one.
                </p>
              </div>
            </div>
          </div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="mt-8 space-y-6">
            <div class="rounded-md shadow-sm space-y-4">
              <div>
                <label for="password" class="sr-only">New password</label>
                <input
                  id="password"
                  formControlName="password"
                  type="password"
                  autocomplete="new-password"
                  required
                  class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="New password"
                />
              </div>
              <div>
                <label for="confirmPassword" class="sr-only">Confirm password</label>
                <input
                  id="confirmPassword"
                  formControlName="confirmPassword"
                  type="password"
                  autocomplete="new-password"
                  required
                  class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            @if (passwordMismatch()) {
              <p class="text-sm text-red-600">Passwords do not match.</p>
            }

            <div>
              <button
                type="submit"
                [disabled]="loading() || form.invalid || passwordMismatch()"
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                @if (loading()) {
                  <span>Resetting...</span>
                } @else {
                  <span>Reset password</span>
                }
              </button>
            </div>
          </form>
        }

        <div class="text-center">
          <a routerLink="/login" class="font-medium text-indigo-600 hover:text-indigo-500">
            Back to sign in
          </a>
        </div>
      </div>
    </div>
  `,
})
export default class ResetPasswordComponent {
  private auth = inject(Auth);
  private router = inject(Router);

  token = signal<string | null>(null);
  error = signal(false);
  loading = signal(false);

  form = new FormGroup({
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', [Validators.required]),
  });

  passwordMismatch = signal(false);

  constructor() {
    // Get token from URL query params
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const errorParam = params.get('error');

    if (errorParam || !token) {
      this.error.set(true);
    } else {
      this.token.set(token);
    }

    // Watch for password mismatch
    this.form.valueChanges.subscribe(() => {
      const { password, confirmPassword } = this.form.value;
      this.passwordMismatch.set(
        !!password && !!confirmPassword && password !== confirmPassword
      );
    });
  }

  async onSubmit() {
    if (this.form.invalid || !this.token() || this.passwordMismatch()) return;

    this.loading.set(true);
    const success = await this.auth.resetPassword(
      this.token()!,
      this.form.value.password!
    );
    this.loading.set(false);

    if (success) {
      this.router.navigate(['/login'], { queryParams: { reset: 'success' } });
    } else {
      this.error.set(true);
    }
  }
}
