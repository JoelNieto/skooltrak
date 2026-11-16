import { Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from './button';
import { Icon } from './icon';

@Component({
  selector: 'lib-error',
  imports: [Button, Icon],
  template: `
    <div class="bg-surface-0 min-h-screen flex items-center justify-center p-4">
      <div class="max-w-lg w-full bg-surface-1 border border-line rounded-2xl overflow-hidden">
        <div class="p-8">
          <!-- Error Code -->
          <div class="text-center mb-8">
            <h2 class="text-4xl font-semibold text-ink-strong mt-4">
              {{ title() }}
            </h2>
            <p class="text-ink-muted mt-2">
              {{ description() }}
            </p>
          </div>

          <div class="flex justify-center mb-8">
            <div class="w-48 h-48 bg-error/30 rounded-full flex items-center justify-center">
              <ui-icon name="circle-alert" class="text-[5rem] text-error!" />
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button uiButton variant="danger" size="lg" (click)="goHome()">
              <ui-icon name="house" />
              Inicio
            </button>
            <button uiButton variant="danger" size="lg" (click)="retry.emit()">
              <ui-icon name="refresh-cw" />
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
  public description = input<string | undefined | null>('Hubo un error inesperado');
  public retry = output<void>();
  public goHome() {
    this.#router.navigate(['/']);
  }
}
