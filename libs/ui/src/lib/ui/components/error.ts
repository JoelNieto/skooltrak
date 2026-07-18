import { Component, inject, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'lib-error',
  imports: [],

  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div
      class="bg-gradient-to-br from-blue-50 to-red-100 min-h-screen flex items-center justify-center p-4"
    >
      <div
        class="max-w-lg w-full bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div class="p-8">
          <!-- Error Code -->
          <div class="text-center mb-8">
            <h2 class="text-4xl font-semibold text-gray-800 mt-4">
              {{ title() }}
            </h2>
            <p class="text-gray-600 mt-2">
              {{ description() }}
            </p>
          </div>

          <div class="flex justify-center mb-8">
            <div
              class="w-48 h-48 bg-error/30 rounded-full flex items-center justify-center"
            >
              <span class="material-symbols-outlined text-[5rem] text-error!"
                >error</span
              >
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button class="btn btn-error btn-soft btn-lg" (click)="goHome()">
              <span class="material-symbols-outlined">home</span>
              Inicio
            </button>
            <button class="btn btn-error btn-lg" (click)="retry.emit()">
              <span class="material-symbols-outlined">refresh</span>
              Reintentar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class Error {
  #router = inject(Router);
  public title = input<string>('Algo salio mal');
  public description = input<string | undefined | null>(
    'Hubo un error inesperado'
  );
  public retry = output<void>();
  public goHome() {
    this.#router.navigate(['/']);
  }
}
