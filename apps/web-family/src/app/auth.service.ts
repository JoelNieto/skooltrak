import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { ACCESS_TOKEN_STORAGE_KEY, readAccessTokenFromStorage } from '#/client-auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  #http = inject(HttpClient);

  readonly token = signal<string | null>(readAccessTokenFromStorage());

  isAuthenticated(): boolean {
    return !!this.token();
  }

  login(email: string, password: string) {
    return this.#http.post<{ accessToken: string }>(
      '/api/v1/auth/login',
      { email, password },
      { withCredentials: true },
    );
  }

  setToken(token: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
    }
    this.token.set(token);
  }

  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    }
    this.token.set(null);
  }
}
