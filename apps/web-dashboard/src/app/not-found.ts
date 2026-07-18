import { Location } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [],

  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<div class="bg-linear-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center p-4">
    <div class="max-w-lg w-full bg-white rounded-2xl shadow-xl overflow-hidden">
      <div class="p-8">
        <!-- Error Code -->
        <div class="text-center mb-8">
          <h1 class="text-9xl font-bold text-primary">404</h1>
          <h2 class="text-2xl font-semibold text-gray-800 mt-4">Pagina no encontrada</h2>
          <p class="text-gray-600 mt-2">Lo siento, no pudimos encontrar la pagina que estabas buscando.</p>
        </div>

        <!-- Illustration -->
        <div class="flex justify-center mb-8">
          <div class="w-48 h-48 bg-indigo-100 rounded-full flex items-center justify-center">
            <svg
              class="w-32 h-32 text-indigo-500"
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
          <button class="btn btn-primary btn-lg" (click)="goHome()">
            <span class="material-symbols-outlined">home</span>
            Inicio
          </button>
          <button class="btn btn-outline btn-neutral btn-lg" (click)="goBack()">
            <span class="material-symbols-outlined">arrow_back</span>
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
