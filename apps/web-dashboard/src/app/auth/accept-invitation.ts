import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Auth from './auth';
import { authClient } from './auth-client';

@Component({
  selector: 'app-accept-invitation',
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        @if (loading()) {
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p class="mt-4 text-gray-600">Processing your invitation...</p>
          </div>
        } @else if (error()) {
          <div class="rounded-md bg-red-50 p-4">
            <div class="flex">
              <div class="shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">Error</h3>
                <p class="text-sm text-red-700 mt-1">{{ error() }}</p>
              </div>
            </div>
          </div>
          <div class="text-center">
            <a routerLink="/login" class="font-medium text-indigo-600 hover:text-indigo-500"> Go to sign in </a>
          </div>
        } @else if (success()) {
          <div class="rounded-md bg-green-50 p-4">
            <div class="flex">
              <div class="shrink-0">
                <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-green-800">Welcome!</h3>
                <p class="text-sm text-green-700 mt-1">You've successfully joined {{ organizationName() }}.</p>
              </div>
            </div>
          </div>
          <div class="text-center">
            <a
              routerLink="/home"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Go to Dashboard
            </a>
          </div>
        } @else if (needsAuth()) {
          <div class="text-center">
            <h2 class="text-2xl font-bold text-gray-900">Sign in required</h2>
            <p class="mt-2 text-gray-600">Please sign in to accept this invitation.</p>
            <div class="mt-6 space-x-4">
              <a
                [routerLink]="['/login']"
                [queryParams]="{ returnUrl: '/accept-invitation/' + invitationId() }"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Sign in
              </a>
              <a
                [routerLink]="['/register']"
                [queryParams]="{ returnUrl: '/accept-invitation/' + invitationId() }"
                class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                Create account
              </a>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export default class AcceptInvitationComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(Auth);

  loading = signal(true);
  error = signal<string | null>(null);
  success = signal(false);
  needsAuth = signal(false);
  organizationName = signal('');
  invitationId = signal('');

  constructor() {
    this.invitationId.set(this.route.snapshot.params['id']);
    this.processInvitation();
  }

  private async processInvitation() {
    const invitationId = this.invitationId();

    if (!invitationId) {
      this.error.set('Invalid invitation link');
      this.loading.set(false);
      return;
    }

    // Check if user is authenticated
    if (!this.auth.isAuthenticatedSync()) {
      this.needsAuth.set(true);
      this.loading.set(false);
      return;
    }

    try {
      const { data, error } = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (error) {
        this.error.set(error.message || 'Failed to accept invitation');
        this.loading.set(false);
        return;
      }

      this.success.set(true);
      this.organizationName.set((data as any)?.organization?.name || 'the organization');
    } catch (err: any) {
      this.error.set(err.message || 'Failed to accept invitation');
    } finally {
      this.loading.set(false);
    }
  }
}
