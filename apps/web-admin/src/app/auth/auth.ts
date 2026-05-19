import { Toast } from '#/ui';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, firstValueFrom, of, tap, throwError } from 'rxjs';
import { authClient } from './auth-client';

@Injectable({
  providedIn: 'root',
})
export default class Auth {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  #router = inject(Router);
  #toasts = inject(Toast);
  public readonly isInitialized = signal(false);
  public isSigning = signal(false);
  public user = computed(() => this.userResource.value() as any);
  public isUserLoading = computed(() => this.userResource.isLoading());

  private sessionState = signal<{
    user?: any;
    session?: any;
    token?: string;
    redirect?: boolean;
  } | null>(null);

  public getAccessToken() {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  public token = linkedSignal(() => {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('access_token');
    }
    return null;
  });

  public isAuthenticated() {
    const session = this.sessionState();
    const token = this.getAccessToken();
    return !!session?.user || !!token;
  }

  public userResource = rxResource({
    params: () => ({
      token: this.token(),
      session: this.sessionState(),
    }),
    stream: ({ params }) => {
      const { token, session } = params;
      if (!token && !session) {
        return of(null);
      }
      return this.http.get<any>('/api/v1/auth/me').pipe(
        tap(() => {
          if (this.isSigning()) {
            this.#router.navigate(['/home']);
            this.isSigning.set(false);
          }
        }),
        catchError((err: HttpErrorResponse) => {
          const msg =
            typeof err.error === 'object' && err.error && 'message' in err.error
              ? String((err.error as { message?: string }).message)
              : err.message;
          this.#toasts.showError(msg);
          this.isSigning.set(false);
          return of(null);
        }),
      );
    },
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.isInitialized.set(true);
      this.initializeSession();
    }

    effect(() => {
      const token = this.token();
      if (isPlatformBrowser(this.platformId)) {
        if (token) {
          localStorage.setItem('access_token', token);
        } else {
          localStorage.removeItem('access_token');
        }
      }
    });
  }

  private async initializeSession() {
    try {
      const session = await authClient.getSession();
      if (session.data) {
        this.sessionState.set(session.data);
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  }

  public async signIn(email: string, password: string): Promise<boolean> {
    this.isSigning.set(true);

    try {
      const res = await firstValueFrom(
        this.http.post<{ accessToken: string }>(
          '/api/v1/auth/login',
          { email, password },
          { withCredentials: true },
        ),
      );

      const accessToken = res?.accessToken;
      if (accessToken) {
        this.token.set(accessToken);
        this.isSigning.set(false);
        this.#router.navigate(['/home']);
        return true;
      }

      this.isSigning.set(false);
      return false;
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = err?.error?.message ?? err?.message ?? 'Credenciales inválidas';
      this.#toasts.showError(msg);
      this.isSigning.set(false);
      return false;
    }
  }

  public async logout() {
    try {
      await authClient.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }

    this.sessionState.set(null);
    this.token.set(null);
    this.#router.navigate(['/login']);
  }

  private getApiBaseUrl(): string {
    if (isPlatformBrowser(this.platformId)) {
      const isDev = window.location.hostname === 'localhost';
      if (isDev) {
        return 'http://localhost:3000';
      }
    }
    return '';
  }

  public async requestPasswordReset(email: string): Promise<boolean> {
    try {
      const baseUrl = this.getApiBaseUrl();
      await fetch(`${baseUrl}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          redirectTo: `${window.location.origin}/reset-password`,
        }),
      });

      return true;
    } catch {
      return true;
    }
  }

  public async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      const result = await firstValueFrom(
        this.http.post<{ accessToken: string }>(
          '/api/v1/auth/reset-password',
          { token, newPassword },
          { withCredentials: true },
        ),
      );

      if (result?.accessToken) {
        this.token.set(result.accessToken);
        this.#toasts.showSuccess('Password reset successfully');
        return true;
      }

      this.#toasts.showError('Failed to reset password');
      return false;
    } catch (err: any) {
      this.#toasts.showError(err?.error?.message ?? err?.message ?? 'Failed to reset password');
      return false;
    }
  }
}
