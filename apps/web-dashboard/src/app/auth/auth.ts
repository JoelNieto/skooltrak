import { Toast } from '@/ui';
import { isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, Injectable, linkedSignal, PLATFORM_ID, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { catchError, filter, firstValueFrom, map, of, throwError } from 'rxjs';
import {
  AuthIsEmailVerifiedDocument,
  AuthLoginDocument,
  AuthMeDocument,
  AuthOnboardingStatusDocument,
  AuthResetPasswordDocument,
  Query,
} from '../graphql/generated/graphql';
import { authClient } from './auth-client';

export type DecodedToken = {
  userId: string;
  role: string;
  organizationId: string;
  permissions: string[];
  iat: number;
  exp: number;
};

@Injectable({
  providedIn: 'root',
})
export default class Auth {
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  #apollo = inject(Apollo);
  #toasts = inject(Toast);
  public readonly isInitialized = signal(false);
  public isSigning = signal(false);

  // Session state from better-auth
  private sessionState = signal<{
    user?: any;
    session?: any;
    token?: string;
    redirect?: boolean;
  } | null>(null);

  // For backward compatibility with existing code that uses token
  public token = linkedSignal(() => {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('access_token');
    }
    return null;
  });

  public userResource = rxResource({
    params: () => ({
      isAuthenticated: this.isAuthenticated(),
    }),
    stream: ({ params }) => {
      const { isAuthenticated } = params;
      if (!isAuthenticated) {
        return of(null);
      }
      return this.#apollo
        .watchQuery({
          query: AuthMeDocument,
          fetchPolicy: 'network-only',
        })
        .valueChanges.pipe(
          // Skip in-flight emissions so rxResource does not "resolve" with null before `me` arrives.
          filter((res) => !res.loading),
          map((res) => {
            if (res.error) {
              const err = res.error as { message: string; errors?: readonly { message: string }[] };
              const fromGql = err.errors?.map((ge: { message: string }) => ge.message) ?? [];
              const msg = [...fromGql, err.message].filter(Boolean).join('; ');
              throw new Error(msg || 'Me query failed');
            }
            const me = res.data?.me as Query['me'];
            if (me == null) {
              throw new Error('No autenticado');
            }
            return me;
          }),
          catchError((err: Error) => {
            if (this.#shouldClearCredentialsForMeError(err)) {
              this.#clearStoredCredentialsAfterAuthFailure();
              this.#maybeNavigateToLoginAfterAuthFailure();
              return of(null);
            }
            this.#toasts.showError(err.message);
            this.isSigning.set(false);
            return throwError(() => err);
          }),
        );
    },
  });

  public user = computed(() => this.userResource.value());
  public isUserLoading = computed(() => this.userResource.isLoading());

  // Wait for a real `me` payload or a terminal error — not "resolved" with null because
  // catchError previously turned GraphQL failures into of(null), which mis-routed to onboarding.
  public isUserReady = computed(() => {
    if (!this.isAuthenticated()) {
      return true;
    }
    const status = this.userResource.status();
    if (status === 'error') {
      return true;
    }
    return status === 'resolved' && this.user() != null;
  });

  // Promise-based method for guards to wait until user data is ready
  public waitUntilReady(): Promise<boolean> {
    if (this.isUserReady()) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.isUserReady()) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 50);
    });
  }

  /**
   * Reload user data from the server and wait until it's refreshed.
   */
  public reloadUser(): Promise<void> {
    this.userResource.reload();
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const status = this.userResource.status();
        if (status === 'resolved' || status === 'error') {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
    });
  }

  // Computed from user or session
  public userColor = computed(() => this.user()?.color);
  public role = computed(() => this.user()?.role?.name || this.sessionState()?.user?.role?.name);
  public permissions = computed<string[]>(() => this.user()?.role?.permissions?.map((p: any) => p.descriptiveId) || []);
  public onboardingStep = computed(() => (this.user() as any)?.onboardingStep as string | null);

  public userName = computed(() => `${this.user()?.firstName} ${this.user()?.lastName}`);
  public themePreference = computed(() => (this.user() as { themePreference?: string })?.themePreference);
  public userInitials = computed(
    () =>
      `${this.user()?.firstName?.charAt(0).toUpperCase() || ''}${this.user()?.lastName?.charAt(0).toUpperCase() || ''}`,
  );

  public getAccessToken() {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  public isAdmin = computed(() => this.role() === 'ADMIN' || this.role() === 'ORG_ADMIN');
  public isTeacher = computed(() => this.role() === 'TEACHER');
  public isStudent = computed(() => this.role() === 'STUDENT');
  public isParent = computed(() => this.role() === 'PARENT');

  public isAuthenticated = computed(() => {
    // Check both session state and token for backward compatibility
    const session = this.sessionState();
    const token = this.token();
    return !!session?.user || !!token;
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.isInitialized.set(true);
      // Initialize session from better-auth
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

  /** JWT / session rejected by API — drop local credentials so rxResource can idle cleanly. */
  #shouldClearCredentialsForMeError(err: Error): boolean {
    const m = (err?.message ?? '').toLowerCase();
    return (
      m.includes('invalid token') ||
      m.includes('no autenticado') ||
      m.includes('not authenticated') ||
      m.includes('unauthorized')
    );
  }

  #clearStoredCredentialsAfterAuthFailure(): void {
    void authClient.signOut().catch(() => {});
    this.sessionState.set(null);
    this.token.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('access_token');
    }
  }

  #maybeNavigateToLoginAfterAuthFailure(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const path = this.router.url.split('?')[0] ?? '';
    if (/^\/(login|register|forgot-password|reset-password)(\/|$)/.test(path)) {
      return;
    }
    void this.router.navigateByUrl('/login');
  }

  public async signIn(email: string, password: string): Promise<boolean> {
    this.isSigning.set(true);

    try {
      // Use GraphQL login which returns JWT token
      const res = await firstValueFrom(
        this.#apollo.mutate({
          mutation: AuthLoginDocument,
          variables: { email, password },
        }),
      );

      const accessToken = res.data?.login?.accessToken;
      if (accessToken) {
        this.token.set(accessToken);
        this.isSigning.set(false);
        this.#toasts.showSuccess('Bienvenido de nuevo');
        // The onboardingCompletedGuard will redirect if onboarding is not done
        this.router.navigate(['/home']);
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

  public hasPermission(permission: string) {
    return this.permissions()?.includes(permission) || this.isAdmin();
  }

  public isAuthenticatedSync() {
    const session = this.sessionState();
    const token = this.getAccessToken();
    return !!session?.user || !!token;
  }

  public async logout() {
    try {
      await authClient.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }

    this.sessionState.set(null);
    this.token.set(null);
    this.router.navigate(['/login']);
  }

  // Helper to get API base URL (handles dev vs production)
  private getApiBaseUrl(): string {
    // In browser, use relative URL (proxy handles it)
    // In SSR or if proxy fails, use absolute URL
    if (isPlatformBrowser(this.platformId)) {
      // Try to detect if we're in development
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

      // Always return true to prevent email enumeration
      return true;
    } catch (err: any) {
      console.error('Password reset request error:', err);
      return true; // Return true to prevent email enumeration
    }
  }

  public async resetPassword(token: string, newPassword: string): Promise<string | null> {
    try {
      const result = await firstValueFrom(
        this.#apollo.mutate({
          mutation: AuthResetPasswordDocument,
          variables: { token, newPassword },
        }),
      );

      const accessToken = result.data?.resetPassword?.accessToken;
      if (accessToken) {
        this.token.set(accessToken);
        this.#toasts.showSuccess('Contraseña actualizada exitosamente');
        return accessToken;
      }

      this.#toasts.showError('No se pudo restablecer la contraseña');
      return null;
    } catch (err: any) {
      console.error('Password reset error:', err);
      this.#toasts.showError(err.message || 'No se pudo restablecer la contraseña');
      return null;
    }
  }

  public async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const baseUrl = this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        }),
      });

      if (!response.ok) {
        this.#toasts.showError('Failed to change password');
        return false;
      }

      this.#toasts.showSuccess('Password changed successfully');
      return true;
    } catch (err: any) {
      console.error('Password change error:', err);
      this.#toasts.showError('Failed to change password');
      return false;
    }
  }

  // Email verification check
  public async checkEmailVerified(): Promise<boolean> {
    try {
      const result = await firstValueFrom(
        this.#apollo.query({
          query: AuthIsEmailVerifiedDocument,
          fetchPolicy: 'network-only',
        }),
      );
      return result.data?.isEmailVerified ?? false;
    } catch {
      return false;
    }
  }

  // Onboarding status check
  public async checkOnboardingStatus(): Promise<{
    onboardingCompleted: boolean;
    schoolId?: string;
    schoolName?: string;
    degreesCount: number;
    studyPlansCount: number;
    coursesCount: number;
    groupsCount: number;
  }> {
    try {
      const result = await firstValueFrom(
        this.#apollo.query({
          query: AuthOnboardingStatusDocument,
          fetchPolicy: 'network-only',
        }),
      );
      const os = result.data?.onboardingStatus;
      const fallback = {
        onboardingCompleted: false,
        degreesCount: 0,
        studyPlansCount: 0,
        coursesCount: 0,
        groupsCount: 0,
      };
      if (!os) return fallback;
      return {
        ...fallback,
        onboardingCompleted: os.onboardingCompleted,
        schoolId: os.schoolId != null ? os.schoolId : undefined,
        schoolName: os.schoolName != null ? os.schoolName : undefined,
        degreesCount: os.degreesCount,
        studyPlansCount: os.studyPlansCount,
        coursesCount: os.coursesCount,
        groupsCount: os.groupsCount,
      };
    } catch {
      return {
        onboardingCompleted: false,
        degreesCount: 0,
        studyPlansCount: 0,
        coursesCount: 0,
        groupsCount: 0,
      };
    }
  }
}
