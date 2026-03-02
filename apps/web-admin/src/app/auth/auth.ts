import { Toast } from '@/ui';
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
import { Prisma } from '@generated/prisma';
import { Apollo } from 'apollo-angular';
import {
  WebAdminAuthLoginDocument,
  WebAdminAuthMeDocument,
} from '../graphql/generated';
import { catchError, firstValueFrom, map, of, tap } from 'rxjs';
import { authClient } from './auth-client';

@Injectable({
  providedIn: 'root',
})
export default class Auth {
  private platformId = inject(PLATFORM_ID);
  #apollo = inject(Apollo);
  #router = inject(Router);
  #toasts = inject(Toast);
  public readonly isInitialized = signal(false);
  public isSigning = signal(false);
  public user = computed(() => this.userResource.value());
  public isUserLoading = computed(() => this.userResource.isLoading());

  // Session state from better-auth
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
      return this.#apollo
        .watchQuery({
          query: WebAdminAuthMeDocument,
          fetchPolicy: 'network-only',
        })
        .valueChanges.pipe(
          map((res) => res.data?.me),
          tap(() => {
            if (this.isSigning()) {
              this.#router.navigate(['/home']);
              this.isSigning.set(false);
            }
          }),
          catchError((err) => {
            this.#toasts.showError(err.message);
            this.isSigning.set(false);
            return of(null);
          })
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
      // Use GraphQL login which returns JWT token
      const res = await firstValueFrom(
        this.#apollo.mutate({
          mutation: WebAdminAuthLoginDocument,
          variables: { email, password },
        })
      );

      const accessToken = res.data?.login?.accessToken;
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
      this.#toasts.showError(err.message || 'Credenciales inválidas');
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

  // Helper to get API base URL (handles dev vs production)
  private getApiBaseUrl(): string {
    if (isPlatformBrowser(this.platformId)) {
      const isDev = window.location.hostname === 'localhost';
      if (isDev) {
        return 'http://localhost:3000';
      }
    }
    return '';
  }

  // Password reset methods
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

      return true; // Always return true to prevent email enumeration
    } catch (err: any) {
      return true; // Return true to prevent email enumeration
    }
  }

  public async resetPassword(
    token: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      const baseUrl = this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      if (!response.ok) {
        this.#toasts.showError('Failed to reset password');
        return false;
      }

      this.#toasts.showSuccess('Password reset successfully');
      return true;
    } catch (err: any) {
      this.#toasts.showError('Failed to reset password');
      return false;
    }
  }
}
