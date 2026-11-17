import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Button, Icon } from '#/ui';

@Component({
  selector: 'app-not-found',
  imports: [Button, Icon],
  template: `<div class="bg-surface-0 min-h-screen flex items-center justify-center p-4">
    <div class="max-w-lg w-full bg-surface-1 border border-line rounded-2xl overflow-hidden">
      <div class="p-8">
        <!-- Error Code -->
        <div class="text-center mb-8">
          <h1 class="text-9xl font-bold text-primary">404</h1>
          <h2 class="text-2xl font-semibold text-ink-strong mt-4">Pagina no encontrada</h2>
          <p class="text-ink-muted mt-2">Lo siento, no pudimos encontrar la pagina que estabas buscando.</p>
        </div>

        <!-- Illustration -->
        <div class="flex justify-center mb-8">
          <div class="w-48 h-48 bg-action-subtle rounded-full flex items-center justify-center">
            <svg
              class="w-32 h-32 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button uiButton variant="primary" size="lg" (click)="goHome()">
            <ui-icon name="house" />
            Inicio
          </button>
          <button uiButton size="lg" (click)="goBack()">
            <ui-icon name="arrow-left" />
            Regresar
          </button>
        </div>
      </div>
    </div>
  </div>`,
})
export default class NotFound {
  private router = inject(Router);
  private location = inject(Location);

  public goHome() {
    this.router.navigate(['/']);
  }

  public goBack() {
    this.location.back();
  }
}
