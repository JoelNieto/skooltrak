import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Prisma } from '@prisma/client';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private platformId = inject(PLATFORM_ID);
  private jwtHelper = new JwtHelperService();
  public user = signal<Prisma.UserGetPayload<{
    include: { role: { include: { permissions: true } } };
  }> | null>(null);

  public getAccessToken() {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  public isAuthenticated() {
    const token = this.getAccessToken();
    return token && !this.jwtHelper.isTokenExpired(token);
  }
}
