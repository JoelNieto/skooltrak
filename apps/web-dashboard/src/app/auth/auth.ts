import { isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Prisma } from '@generated/prisma';
@Injectable({
  providedIn: 'root',
})
export default class Auth {
  private platformId = inject(PLATFORM_ID);
  private jwtHelper = new JwtHelperService();
  private router = inject(Router);
  public readonly isInitialized = signal(false);
  public user = signal<Prisma.UserGetPayload<{
    include: {
      role: { include: { permissions: true } };
      teacher: true;
      student: true;
    };
  }> | null>(null);

  public userName = computed(
    () => `${this.user()?.firstName} ${this.user()?.lastName}`
  );
  public userInitials = computed(
    () =>
      `${this.user()?.firstName.charAt(0).toUpperCase()}${this.user()
        ?.lastName.charAt(0)
        .toUpperCase()}`
  );

  public userColor = computed(() => this.user()?.color);
  public role = computed(() => this.user()?.role.name);
  public permissions = computed(() =>
    this.user()?.role.permissions.map((p) => p.descriptiveId)
  );

  public getAccessToken() {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  public isAdmin = computed(() => this.user()?.role.name === 'ADMIN');

  public isAuthenticated = computed(() => {
    // With RenderMode.Client for protected routes, this will only run in browser
    // localStorage is always available when this computed runs
    const token = this.getAccessToken();
    return token !== null && !this.jwtHelper.isTokenExpired(token);
  });

  constructor() {
    // Mark as initialized immediately in browser
    // For SSR with RenderMode.Client, this won't run on server anyway
    if (isPlatformBrowser(this.platformId)) {
      this.isInitialized.set(true);
    }
  }

  public isAuthenticatedSync() {
    const token = this.getAccessToken();
    return token && !this.jwtHelper.isTokenExpired(token);
  }

  public logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('access_token');
    }
    this.router.navigate(['/login']);
    this.user.set(null);
  }
}
