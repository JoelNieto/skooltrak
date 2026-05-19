import { httpBearerInterceptor } from '#/client-auth';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { shellRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(shellRoutes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([httpBearerInterceptor])),
  ],
};
