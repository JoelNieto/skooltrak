import { Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorHouseSimpleDuotone,
  phosphorRepeatDuotone,
  phosphorWarningCircleDuotone,
} from '@ng-icons/phosphor-icons/duotone';

@Component({
  selector: 'lib-error',
  imports: [NgIcon],
  viewProviders: [
    provideIcons({
      phosphorWarningCircleDuotone,
      phosphorHouseSimpleDuotone,
      phosphorRepeatDuotone,
    }),
  ],
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
              <ng-icon
                name="phosphorWarningCircleDuotone"
                class="text-[5rem] text-error!"
              />
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button class="btn btn-error btn-soft btn-lg" (click)="goHome()">
              <ng-icon name="phosphorHouseSimpleDuotone" />
              Inicio
            </button>
            <button class="btn btn-error btn-lg" (click)="retry.emit()">
              <ng-icon name="phosphorRepeatDuotone" />
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
