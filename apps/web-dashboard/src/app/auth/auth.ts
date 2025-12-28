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
import { JwtHelperService } from '@auth0/angular-jwt';
import { Prisma } from '@generated/prisma';
import { Apollo, gql } from 'apollo-angular';
import { catchError, map, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export default class Auth {
  private platformId = inject(PLATFORM_ID);
  private jwtHelper = new JwtHelperService();
  private router = inject(Router);
  #apollo = inject(Apollo);
  #toasts = inject(Toast);
  public readonly isInitialized = signal(false);
  public isSigning = signal(false);

  public token = linkedSignal(() => {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('access_token');
    }
    return null;
  });

  public userResource = rxResource({
    params: () => ({
      token: this.token(),
    }),
    stream: ({ params }) => {
      const { token } = params;
      if (!token) {
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
              this.router.navigate(['/home']);
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

  public user = computed(() => this.userResource.value());
  public isUserLoading = computed(() => this.userResource.isLoading());

  public userColor = computed(() => this.user()?.color);
  public role = computed(() => this.user()?.role.name);
  public permissions = computed(() =>
    this.user()?.role.permissions.map((p) => p.descriptiveId)
  );

  public userName = computed(
    () => `${this.user()?.firstName} ${this.user()?.lastName}`
  );
  public userInitials = computed(
    () =>
      `${this.user()?.firstName.charAt(0).toUpperCase()}${this.user()
        ?.lastName.charAt(0)
        .toUpperCase()}`
  );

  public getAccessToken() {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  public isAdmin = computed(() => this.user()?.role.name === 'ADMIN');
  public isTeacher = computed(() => this.user()?.role.name === 'TEACHER');
  public isStudent = computed(() => this.user()?.role.name === 'STUDENT');
  public isAuthenticated = computed(() => !!this.user());

  constructor() {
    // Mark as initialized immediately in browser
    // For SSR with RenderMode.Client, this won't run on server anyway
    if (isPlatformBrowser(this.platformId)) {
      this.isInitialized.set(true);
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

  public signIn(email: string, password: string) {
    this.#apollo
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
          this.token.set(accessToken);
          this.isSigning.set(true);
        },
        error: (err) => {
          console.error(err);
          this.#toasts.showError(err.message);
        },
      });
  }

  public isAuthenticatedSync() {
    const token = this.getAccessToken();
    return token && !this.jwtHelper.isTokenExpired(token);
  }

  public logout() {
    this.token.set(null);
    this.router.navigate(['/login']);
  }
}
