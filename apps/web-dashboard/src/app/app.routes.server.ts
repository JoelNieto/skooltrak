import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Protected routes (with authGuard) - must use Client mode
  // because they depend on localStorage which is only available in browser
  // Public routes can use Server mode for better SEO, but Client is fine too
  {
    path: 'login',
    renderMode: RenderMode.Server,
  },
  {
    path: '',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
