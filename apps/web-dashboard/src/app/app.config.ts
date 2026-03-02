import { isPlatformBrowser } from '@angular/common';
import { HttpHeaders, provideHttpClient, withFetch } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  PLATFORM_ID,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { ApolloLink, InMemoryCache } from '@apollo/client/core';
import { SetContextLink } from '@apollo/client/link/context';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideApollo(() => {
      const httpLink = inject(HttpLink);
      const platformId = inject(PLATFORM_ID);

      const basic = new SetContextLink(() => ({
        headers: new HttpHeaders({
          Accept: 'application/json, charset=utf-8',
        }),
      }));

      // Auth link - supports both JWT tokens and cookie-based sessions
      const auth = new SetContextLink(() => {
        if (!isPlatformBrowser(platformId)) {
          return {};
        }
        // Still include JWT token for backward compatibility
        const token = localStorage.getItem('access_token');
        if (token) {
          return {
            headers: new HttpHeaders({
              Authorization: `Bearer ${token}`,
            }),
          };
        }
        return {};
      });

      return {
        link: ApolloLink.from([
          basic,
          auth,
          httpLink.create({
            uri: '/api/graphql',
            // Include credentials to send cookies for session-based auth
            withCredentials: true,
          }),
        ]),
        cache: new InMemoryCache(),
        defaultOptions: {
          watchQuery: {
            fetchPolicy: 'cache-and-network',
          },
        },
      };
    }),
  ],
};
