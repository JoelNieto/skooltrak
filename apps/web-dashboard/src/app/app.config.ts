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
import { createDefaultApolloBearerAuthLink, readAccessTokenFromStorage } from '@/client-auth';
import { ApolloLink, InMemoryCache, split } from '@apollo/client/core';
import { SetContextLink } from '@apollo/client/link/context';
import { getMainDefinition } from '@apollo/client/utilities';
import { Kind, OperationTypeNode } from 'graphql';
import { createClient } from 'graphql-ws';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
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

      const auth = createDefaultApolloBearerAuthLink(platformId);

      const http = httpLink.create({
        uri: '/api/graphql',
        withCredentials: true,
      });

      // WebSocket link for subscriptions (browser only)
      const ws =
        isPlatformBrowser(platformId) &&
        (() => {
          const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
          const wsUrl = `${protocol}//${location.host}/api/graphql`;
          return new GraphQLWsLink(
            createClient({
              url: wsUrl,
              connectionParams: () => {
                const token = readAccessTokenFromStorage();
                return token ? { authorization: `Bearer ${token}` } : {};
              },
            })
          );
        })();

      const link = ws
        ? split(
            ({ query }) => {
              const def = getMainDefinition(query);
              return (
                def.kind === Kind.OPERATION_DEFINITION &&
                def.operation === OperationTypeNode.SUBSCRIPTION
              );
            },
            ws,
            ApolloLink.from([basic, auth, http])
          )
        : ApolloLink.from([basic, auth, http]);

      return {
        link,
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
