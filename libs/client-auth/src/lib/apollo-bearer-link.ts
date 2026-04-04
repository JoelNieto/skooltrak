import { isPlatformBrowser } from '@angular/common';
import { HttpHeaders } from '@angular/common/http';
import type { ApolloLink } from '@apollo/client/core';
import { SetContextLink } from '@apollo/client/link/context';
import { readAccessTokenFromStorage } from './access-token';

export type TokenReader = () => string | null;

/**
 * Apollo link that adds `Authorization: Bearer` when an access token is present (browser only).
 */
export function createApolloBearerAuthLink(
  getToken: TokenReader,
  isBrowser: () => boolean,
): SetContextLink {
  return new SetContextLink(() => {
    if (!isBrowser()) {
      return {};
    }
    const token = getToken();
    if (!token) {
      return {};
    }
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
  });
}

/** Default token reader: `localStorage` access_token (browser only). */
export function createDefaultBrowserTokenReader(): TokenReader {
  return () => readAccessTokenFromStorage();
}

export function createDefaultApolloBearerAuthLink(platformId: object): ApolloLink {
  const getToken = createDefaultBrowserTokenReader();
  return createApolloBearerAuthLink(getToken, () => isPlatformBrowser(platformId));
}
