import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { readAccessTokenFromStorage } from './access-token';

/**
 * Adds `Authorization: Bearer <token>` when a token exists (browser only).
 * Use with `provideHttpClient(withInterceptors([httpBearerInterceptor]))`.
 */
export const httpBearerInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }
  const token = readAccessTokenFromStorage();
  if (!token) {
    return next(req);
  }
  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
