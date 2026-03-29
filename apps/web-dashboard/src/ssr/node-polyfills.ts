/**
 * Native Federation's dev `remoteEntry.json` includes `buildNotificationsEndpoint` for browser SSE
 * (hot reload when a remote rebuilds). In Node SSR that runs `watchFederationBuildCompletion`,
 * which needs `EventSource`, `window`, and compatible DOM `Event` types — and it isn't useful on
 * the server anyway. Strip the field from fetched remote entries so federation skips SSE entirely.
 */
const FETCH_PATCH_KEY = '__skooltrakRemoteEntryFetchPatched__';

function installRemoteEntryFetchPatch(): void {
  const g = globalThis as typeof globalThis & { [FETCH_PATCH_KEY]?: boolean };
  if (g[FETCH_PATCH_KEY]) {
    return;
  }
  g[FETCH_PATCH_KEY] = true;

  const originalFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const response = await originalFetch(input, init);
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url;

    if (!url.includes('remoteEntry.json')) {
      return response;
    }

    const clone = response.clone();
    try {
      const text = await clone.text();
      const data = JSON.parse(text) as Record<string, unknown>;
      if (data && typeof data === 'object' && 'buildNotificationsEndpoint' in data) {
        delete data['buildNotificationsEndpoint'];
        return new Response(JSON.stringify(data), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      }
      return new Response(text, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    } catch {
      return response;
    }
  };
}

installRemoteEntryFetchPatch();
