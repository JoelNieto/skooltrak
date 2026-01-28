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
import { Apollo, gql } from 'apollo-angular';
import { catchError, map, of, tap } from 'rxjs';
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
        .watchQuery<{
          me: Prisma.UserGetPayload<{
            include: {
              role: { include: { permissions: true } };
              teacher: true;
              student: true;
            };
          }>;
        }>({
          query: gql`
            query Me {
              me {
                id
                email
                firstName
                lastName
                color
                teacher {
                  id
                  firstName
                  fatherName
                }
                student {
                  id
                  firstName
                  fatherName
                }
                role {
                  name
                  permissions {
                    id
                    descriptiveId
                    description
                  }
                }
              }
            }
          `,
          fetchPolicy: 'network-only',
        })
        .valueChanges.pipe(
          map((res) => res.data.me),
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

  public async signIn(email: string, password: string) {
    this.isSigning.set(true);

    try {
      // Use better-auth client for sign in
      const { data, error } = await authClient.signIn.email({
        email,
        password,
        callbackURL: '/home',
      });

      if (error) {
        this.#toasts.showError(error.message || 'Sign in failed');
        this.isSigning.set(false);
        return;
      }

      // Update session state
      this.sessionState.set(data);

      // Also use GraphQL for legacy support
      this.#apollo
        .mutate<{ login: { accessToken: string } }>({
          mutation: gql`
            mutation Login($email: String!, $password: String!) {
              login(email: $email, password: $password) {
                accessToken
              }
            }
          `,
          variables: { email, password },
        })
        .subscribe({
          next: (res) => {
            const { accessToken } = res.data!.login;
            this.token.set(accessToken);
          },
          error: (err) => {
            console.error('GraphQL login error:', err);
          },
        });
    } catch (err: any) {
      console.error('Sign in error:', err);
      this.#toasts.showError(err.message || 'Sign in failed');
      this.isSigning.set(false);
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

  // Password reset methods
  public async requestPasswordReset(email: string): Promise<boolean> {
    try {
      await fetch('/api/auth/forget-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          redirectTo: '/reset-password',
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
      const response = await fetch('/api/auth/reset-password', {
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
