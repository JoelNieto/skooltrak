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

  public isAuthenticated() {
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
