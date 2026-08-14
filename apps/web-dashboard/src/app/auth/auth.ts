import { Toast } from '#/ui';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, effect, inject, linkedSignal, PLATFORM_ID, Service, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { authClient } from './auth-client';

export type DecodedToken = {
  userId: string;
  role: string;
  organizationId: string;
  permissions: string[];
  iat: number;
  exp: number;
};

@Service()
export default class Auth {
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private http = inject(HttpClient);
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

  private userState = signal<any | null>(null);
  private userLoadStatus = signal<'idle' | 'loading' | 'resolved' | 'error'>('idle');

  public user = computed(() => this.userState());
  public isUserLoading = computed(() => this.userLoadStatus() === 'loading');

  public isUserReady = computed(() => {
    if (!this.isAuthenticated()) {
      return true;
    }
    const status = this.userLoadStatus();
    if (status === 'error') {
      return true;
    }
    return status === 'resolved' && this.user() != null;
  });

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

  public async reloadUser(): Promise<void> {
    await this.#loadCurrentUser();
  }

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
    const session = this.sessionState();
    const token = this.token();
    return !!session?.user || !!token;
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

    effect(() => {
      const authed = this.isAuthenticated();
      console.log('Auth state changed, isAuthenticated:', authed);
      void this.#loadCurrentUser(authed);
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
    void authClient.signOut().catch(() => undefined);
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

  async #loadCurrentUser(isAuthenticated = this.isAuthenticated()): Promise<void> {
    if (!isAuthenticated) {
      this.userState.set(null);
      this.userLoadStatus.set('resolved');
      return;
    }

    this.userLoadStatus.set('loading');

    try {
      console.log('Loading current user...');
      const me = await firstValueFrom(this.http.get<any>('/api/v1/auth/me'));
      console.log({ me });
      this.userState.set(me ?? null);
      this.userLoadStatus.set('resolved');
    } catch (err) {
      const httpErr = err as HttpErrorResponse;
      const msg =
        typeof httpErr.error === 'object' && httpErr.error && 'message' in httpErr.error
          ? String((httpErr.error as { message?: string }).message)
          : httpErr.message;
      const synthetic = new Error(msg || 'Me request failed');

      if (httpErr.status === 401 || this.#shouldClearCredentialsForMeError(synthetic)) {
        this.#clearStoredCredentialsAfterAuthFailure();
        this.#maybeNavigateToLoginAfterAuthFailure();
        this.userState.set(null);
        this.userLoadStatus.set('resolved');
        return;
      }

      this.#toasts.showError(msg || 'Me request failed');
      this.isSigning.set(false);
      this.userState.set(null);
      this.userLoadStatus.set('error');
    }
  }

  public async signIn(email: string, password: string): Promise<boolean> {
    this.isSigning.set(true);

    try {
      const res = await firstValueFrom(
        this.http.post<{ accessToken: string }>('/api/v1/auth/login', { email, password }, { withCredentials: true }),
      );

      const accessToken = res?.accessToken;
      if (accessToken) {
        this.token.set(accessToken);
        this.isSigning.set(false);
        this.#toasts.showSuccess('Bienvenido de nuevo');
        void this.redeemPendingChildConnect();
        this.router.navigate(['/home']);
        return true;
      }

      this.isSigning.set(false);
      return false;
    } catch (err: any) {
      console.error('Login error:', err);
      const msg =
        err?.error?.message ?? (typeof err?.error === 'string' ? err.error : err?.message) ?? 'Credenciales inválidas';
      this.#toasts.showError(msg);
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
    } catch (err: any) {
      console.error('Password reset request error:', err);
      return true;
    }
  }

  public async resetPassword(token: string, newPassword: string): Promise<string | null> {
    try {
      const result = await firstValueFrom(
        this.http.post<{ accessToken: string }>(
          '/api/v1/auth/reset-password',
          { token, newPassword },
          { withCredentials: true },
        ),
      );

      const accessToken = result?.accessToken;
      if (accessToken) {
        this.token.set(accessToken);
        this.#toasts.showSuccess('Contraseña actualizada exitosamente');
        return accessToken;
      }

      this.#toasts.showError('No se pudo restablecer la contraseña');
      return null;
    } catch (err: any) {
      console.error('Password reset error:', err);
      const msg = err?.error?.message ?? err?.message ?? 'No se pudo restablecer la contraseña';
      this.#toasts.showError(msg);
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

  public async checkEmailVerified(): Promise<boolean> {
    try {
      const result = await firstValueFrom(this.http.get<boolean>('/api/v1/auth/is-email-verified'));
      return result ?? false;
    } catch {
      return false;
    }
  }

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
      const os = await firstValueFrom(this.http.get<OnboardingStatusResponse>('/api/v1/auth/onboarding-status'));
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

  public async redeemPendingChildConnect(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const token = localStorage.getItem('pending_child_connect_token');
    if (!token) return;

    if (!this.isAuthenticated()) return;

    try {
      const res = await firstValueFrom(
        this.http.post<{ status: string; studentId: string }>('/api/v1/auth/child-connect/redeem', { token }),
      );
      if (res?.status === 'LINKED') {
        this.#toasts.showSuccess('Estudiante vinculado exitosamente');
        this.router.navigate(['/students', res.studentId]);
        return;
      }
    } catch (err: any) {
      console.error('Child connect redeem error:', err);
      const msg = err?.error?.message ?? 'No se pudo vincular el estudiante';
      this.#toasts.showError(msg);
    } finally {
      localStorage.removeItem('pending_child_connect_token');
    }
  }
}

interface OnboardingStatusResponse {
  onboardingCompleted: boolean;
  schoolId?: string | null;
  schoolName?: string | null;
  degreesCount: number;
  studyPlansCount: number;
  coursesCount: number;
  groupsCount: number;
}
