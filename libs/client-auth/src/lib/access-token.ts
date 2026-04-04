/** localStorage key used across Skooltrak web apps (dashboard, store, shell). */
export const ACCESS_TOKEN_STORAGE_KEY = 'access_token';

export function readAccessTokenFromStorage(): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function writeAccessTokenToStorage(token: string | null): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  }
}
