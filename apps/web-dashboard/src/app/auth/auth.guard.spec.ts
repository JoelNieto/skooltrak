import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Route, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import Auth from './auth';
import { adminGuard, authGuard, onboardingCompletedGuard, parentGuard, studentGuard, teacherGuard } from './auth.guard';

@Component({ template: '' })
class Stub {}

/** Mirrors the shape of DASHBOARD_ROUTES: role-gated `home` children under an auth-guarded shell. */
const routes: Route[] = [
  { path: 'login', component: Stub },
  { path: 'onboarding/choose-path', component: Stub },
  {
    path: '',
    canActivate: [authGuard, onboardingCompletedGuard],
    canActivateChild: [authGuard],
    children: [
      { path: 'home', canMatch: [adminGuard], component: Stub, data: { home: 'admin' } },
      { path: 'home', canMatch: [teacherGuard], component: Stub, data: { home: 'teacher' } },
      { path: 'home', canMatch: [studentGuard], component: Stub, data: { home: 'student' } },
      { path: 'home', canMatch: [parentGuard], component: Stub, data: { home: 'parent' } },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
  { path: '**', component: Stub, data: { notFound: true } },
];

function setup(state: { authenticated: boolean; user: unknown; role?: string }) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(routes),
      {
        provide: Auth,
        useValue: {
          isAuthenticated: signal(state.authenticated),
          user: signal(state.user),
          role: signal(state.role),
          onboardingStep: signal(null),
          waitUntilReady: () => Promise.resolve(true),
          hasPermission: () => false,
        },
      },
    ],
  });
}

describe('dashboard route guards', () => {
  it.each(['/', '/home'])('sends a logged-out visitor from %s to /login instead of the 404 page', async (url) => {
    setup({ authenticated: false, user: null });
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl(url);

    expect(TestBed.inject(Router).url).toBe('/login');
  });

  it('sends a user whose token is stale (me failed) to /login', async () => {
    setup({ authenticated: true, user: null });
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/home');

    expect(TestBed.inject(Router).url).toBe('/login');
  });

  it('opens the role-specific home for an onboarded teacher', async () => {
    setup({ authenticated: true, user: { organizationId: 'org-1' }, role: 'TEACHER' });
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/');

    const router = TestBed.inject(Router);
    expect(router.url).toBe('/home');
    expect(router.routerState.snapshot.root.firstChild?.firstChild?.data).toEqual({ home: 'teacher' });
  });
});
