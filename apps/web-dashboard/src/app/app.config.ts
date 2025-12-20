import { isPlatformBrowser } from '@angular/common';
import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  PLATFORM_ID,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { ApolloLink, InMemoryCache } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideApollo(() => {
      const httpLink = inject(HttpLink);
      const platformId = inject(PLATFORM_ID);

      const basic = setContext(() => ({
        headers: {
          Accept: 'application/json, charset=utf-8',
        },
      }));

      const auth = setContext(() => {
        if (!isPlatformBrowser(platformId)) {
          return {};
        }
        const token = localStorage.getItem('access_token');
        if (token) {
          return {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          };
        }
        return {};
      });
      return {
        link: ApolloLink.from([
          basic,
          auth,
          httpLink.create({ uri: '/api/graphql' }),
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
