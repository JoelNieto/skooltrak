import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { expect, screen, userEvent, within } from 'storybook/test';
import { Confirmation } from '../services/confirmation';
import { Modal } from '../services/modal';
import { DialogData } from '../types/dialog.type';
import { Button } from './button';
import { UiField, UiInput } from './field';

type ModalSize = 'small' | 'medium' | 'large' | 'full';

/** Content rendered inside the modal: receives `data`, closes itself through `closeModal`. */
@Component({
  selector: 'ui-story-modal-content',
  imports: [Button, UiField, UiInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mt-4 flex flex-col gap-4">
      <p class="text-sm text-ink-muted">{{ data()['message'] }}</p>
      <ui-field label="Nombre del curso" required>
        <input uiInput placeholder="Matemáticas 7° A" />
      </ui-field>
      <div class="flex justify-end gap-2">
        <button uiButton variant="ghost" type="button" (click)="closeModal.emit(null)">Cancelar</button>
        <button uiButton variant="primary" type="button" (click)="closeModal.emit('saved')">Guardar</button>
      </div>
    </div>
  `,
})
class ModalContent {
  readonly data = input<Record<string, unknown>>({});
  readonly closeModal = output<unknown>();
}

@Component({
  selector: 'ui-story-modal-demo',
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-start gap-3">
      <button uiButton variant="primary" type="button" (click)="open()">Abrir modal</button>
      <p class="text-sm text-ink-muted">Resultado: {{ result() ?? '—' }}</p>
    </div>
  `,
})
class ModalDemo {
  private readonly modal = inject(Modal);
  readonly title = input('Nuevo curso');
  readonly size = input<ModalSize>('medium');
  readonly showCloseButton = input(true);
  readonly result = signal<string | null>(null);

  open() {
    this.modal
      .open<unknown, ModalContent>(ModalContent, {
        title: this.title(),
        size: this.size(),
        showCloseButton: this.showCloseButton(),
        data: { message: 'Los cursos agrupan a los estudiantes de una sección.' },
      })
      .closed.subscribe((value) => this.result.set(String(value ?? 'cancelado')));
  }
}

@Component({
  selector: 'ui-story-confirmation-demo',
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-start gap-3">
      <button uiButton variant="danger" type="button" (click)="open()">Eliminar estudiante</button>
      <p class="text-sm text-ink-muted">Confirmado: {{ result() ?? '—' }}</p>
    </div>
  `,
})
class ConfirmationDemo {
  private readonly confirmation = inject(Confirmation);
  readonly severity = input<DialogData['severity']>('error');
  readonly hideCancel = input(false);
  readonly result = signal<boolean | null>(null);

  open() {
    this.confirmation
      .confirm({
        title: '¿Eliminar estudiante?',
        message: 'Esta acción no se puede deshacer.',
        confirmText: 'Eliminar',
        severity: this.severity(),
        hideCancel: this.hideCancel(),
      })
      .subscribe((ok) => this.result.set(ok));
  }
}

const modalUsage = `// The content component receives \`data\` and closes the modal by emitting \`closeModal\`.
@Component({ selector: 'app-new-course', template: \`…\` })
export class NewCourse {
  readonly data = input<Record<string, unknown>>({});
  readonly closeModal = output<unknown>();
}

// Caller
private readonly modal = inject(Modal);

openNewCourse() {
  this.modal
    .open(NewCourse, {
      title: 'Nuevo curso',
      size: 'medium', // 'small' | 'medium' | 'large' | 'full'
      showCloseButton: true,
      data: { message: 'Los cursos agrupan a los estudiantes de una sección.' },
    })
    .closed.subscribe((result) => console.log(result));
}`;

const confirmUsage = `private readonly confirmation = inject(Confirmation);

deleteStudent() {
  this.confirmation
    .confirm({
      title: '¿Eliminar estudiante?',
      message: 'Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      severity: 'error', // 'success' | 'info' | 'warning' | 'error'
    })
    .subscribe((ok) => ok && this.remove());
}`;

const meta: Meta<ModalDemo> = {
  title: 'Components/Modal',
  component: ModalDemo,
  parameters: {
    docs: {
      description: {
        component: 'Opened through the `Modal` service: `modal.open(Component, { title, size, data })`.',
      },
      source: { code: modalUsage, language: 'ts' },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['small', 'medium', 'large', 'full'] },
  },
  args: { title: 'Nuevo curso', size: 'medium', showCloseButton: true },
};

export default meta;
type Story = StoryObj<ModalDemo>;

export const Playground: Story = {};

/** Opens on load so the dialog itself is visible (and exercised by test-storybook). */
export const Opened: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Abrir modal' }));
    // DaisyUI fades the dialog in, so assert it is open rather than already fully visible.
    await expect(await screen.findByRole('dialog')).toHaveAttribute('open');
  },
};

export const Confirm: StoryObj<ConfirmationDemo> = {
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [ConfirmationDemo] },
    template: `<ui-story-confirmation-demo [severity]="severity" [hideCancel]="hideCancel" />`,
  }),
  argTypes: { severity: { control: 'inline-radio', options: ['success', 'info', 'warning', 'error'] } },
  args: { severity: 'error', hideCancel: false },
  parameters: {
    docs: {
      description: { story: '`Confirmation.confirm(data)` → `Observable<boolean>`, built on the modal.' },
      source: { code: confirmUsage, language: 'ts' },
    },
  },
};
