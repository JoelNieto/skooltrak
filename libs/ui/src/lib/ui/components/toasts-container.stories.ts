import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { Toast } from '../services/toast';
import { ToastObject } from '../types/toast-types';
import { Button } from './button';
import { ToastsContainer } from './toasts-container';

const sample: ToastObject[] = [
  { id: '1', type: 'success', message: 'Calificaciones guardadas' },
  { id: '2', type: 'info', message: 'Nuevo mensaje', detail: 'De: Coordinación académica' },
  { id: '3', type: 'warning', message: 'La sesión expira en 5 minutos' },
  { id: '4', type: 'error', message: 'No se pudo guardar', detail: 'Revisa tu conexión' },
];

/** Same wiring as app.ts: buttons call the `Toast` service, the container renders `toastList()`. */
@Component({
  selector: 'ui-story-toast-demo',
  imports: [Button, ToastsContainer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap gap-2">
      <button uiButton type="button" (click)="toast.showSuccess('Calificaciones guardadas')">Success</button>
      <button uiButton type="button" (click)="toast.showInfo('Nuevo mensaje recibido')">Info</button>
      <button uiButton type="button" (click)="toast.showWarning('La sesión expira pronto')">Warning</button>
      <button uiButton type="button" (click)="toast.showError('No se pudo guardar')">Error</button>
      <button
        uiButton
        variant="ghost"
        type="button"
        (click)="toast.showToast({ type: 'info', message: 'Con detalle', detail: 'Se cierra en 10 s', timeout: 10000 })"
      >
        Con detalle
      </button>
    </div>
    <lib-toasts-container [toasts]="toast.toastList()" />
  `,
})
class ToastDemo {
  protected readonly toast = inject(Toast);
}

const meta: Meta<ToastsContainer> = {
  title: 'Components/Toasts',
  component: ToastsContainer,
  parameters: { layout: 'fullscreen' },
  args: { toasts: sample },
  render: (args) => ({ props: args, template: `<div class="h-96"><lib-toasts-container [toasts]="toasts" /></div>` }),
};

export default meta;
type Story = StoryObj<ToastsContainer>;

/** Every severity, rendered statically. */
export const AllTypes: Story = {};

/** Live: toasts disappear after their timeout (5 s by default). */
export const WithService: StoryObj = {
  render: () => ({ moduleMetadata: { imports: [ToastDemo] }, template: `<ui-story-toast-demo />` }),
  parameters: {
    layout: 'padded',
    docs: {
      source: {
        language: 'ts',
        code: `// Once, in the app shell template:
<lib-toasts-container [toasts]="toast.toastList()" />

// Anywhere:
private readonly toast = inject(Toast);

this.toast.showSuccess('Calificaciones guardadas');
this.toast.showError('No se pudo guardar');
this.toast.showToast({ type: 'info', message: 'Con detalle', detail: 'Se cierra en 10 s', timeout: 10000 });`,
      },
    },
  },
};
