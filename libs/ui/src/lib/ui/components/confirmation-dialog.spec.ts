import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogData } from '../types/dialog.type';
import { ConfirmationDialog } from './confirmation-dialog';

describe('ConfirmationDialog', () => {
  let fixture: ComponentFixture<ConfirmationDialog>;

  async function render(data: DialogData) {
    await TestBed.configureTestingModule({ imports: [ConfirmationDialog] }).compileComponents();
    fixture = TestBed.createComponent(ConfirmationDialog);
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    return { buttons, confirm: buttons[buttons.length - 1] };
  }

  it('renders the confirm button with the uiButton primitive, destructive by default', async () => {
    const { confirm } = await render({ title: 'Eliminar', message: '¿Seguro?' });
    expect(confirm.textContent?.trim()).toBe('Confirmar');
    expect(confirm.classList).toContain('ui-btn');
    expect(confirm.classList).toContain('btn-error');
    expect(confirm.classList).toContain('btn-outline');
    expect(confirm.classList).not.toContain('btn-soft');
  });

  it('uses the primary variant for a non-destructive severity', async () => {
    const { confirm } = await render({ title: 'Aprobar', message: '¿Enviar?', confirmText: 'Aprobar y enviar', severity: 'warning' });
    expect(confirm.textContent?.trim()).toBe('Aprobar y enviar');
    expect(confirm.classList).toContain('ui-btn-primary');
    expect(confirm.classList).not.toContain('btn-error');
  });

  it('emits true on confirm and false on cancel', async () => {
    const { buttons } = await render({ title: 'Eliminar', message: '¿Seguro?' });
    const emitted: boolean[] = [];
    fixture.componentInstance.closeModal.subscribe((v) => emitted.push(v));
    buttons[0].click();
    buttons[1].click();
    expect(emitted).toEqual([false, true]);
  });

  it('hides cancel when asked', async () => {
    const { buttons } = await render({ title: 'Listo', message: 'Hecho', hideCancel: true, severity: 'success' });
    expect(buttons).toHaveLength(1);
  });
});
