import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, FormField, required } from '@angular/forms/signals';
import { UiField, UiInput, UiSelect } from './field';

@Component({
  imports: [UiField, UiInput, UiSelect, FormField],
  template: `
    <ui-field label="Nombre" hint="Como aparece en la cédula" [field]="f.name">
      <input uiInput [formField]="f.name" />
    </ui-field>

    <ui-field label="Género" [field]="f.gender">
      <select uiSelect id="gender-select" [formField]="f.gender">
        <option value="">Selecciona…</option>
        <option value="F">Femenino</option>
      </select>
    </ui-field>

    <ui-field label="Notas" [error]="serverError()" required>
      <textarea uiInput></textarea>
    </ui-field>
  `,
})
class Host {
  model = signal({ name: '', gender: '' });
  f = form(this.model, (p) => {
    required(p.name, { message: 'El nombre es requerido' });
  });
  serverError = signal<string | null>(null);
}

function setup() {
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  const fields = root.querySelectorAll('ui-field');
  return { fixture, host: fixture.componentInstance, root, fields };
}

describe('ui-field + uiInput / uiSelect', () => {
  it('links the label to the control and styles the controls', () => {
    const { fields } = setup();
    const label = fields[0].querySelector('label') as HTMLLabelElement;
    const input = fields[0].querySelector('input') as HTMLInputElement;
    expect(label.textContent).toContain('Nombre');
    expect(input.id).toBeTruthy();
    expect(label.htmlFor).toBe(input.id);
    expect(input.classList).toContain('input');
    expect(input.classList).toContain('ui-control');
    expect(fields[2].querySelector('textarea')?.classList).toContain('textarea');
    expect(fields[1].querySelector('select')?.classList).toContain('select');
  });

  it('keeps an explicit control id and points the label at it', () => {
    const { fields } = setup();
    expect(fields[1].querySelector('select')?.id).toBe('gender-select');
    expect((fields[1].querySelector('label') as HTMLLabelElement).htmlFor).toBe('gender-select');
  });

  it('shows the required marker from the signal-forms field or the required input', () => {
    const { fields } = setup();
    expect(fields[0].querySelector('.ui-field-required')).not.toBeNull(); // required() validator
    expect(fields[1].querySelector('.ui-field-required')).toBeNull();
    expect(fields[2].querySelector('.ui-field-required')).not.toBeNull(); // required attribute
  });

  it('shows the hint and describes the control with it until there is an error', () => {
    const { fields } = setup();
    const hint = fields[0].querySelector('.ui-field-hint') as HTMLElement;
    const input = fields[0].querySelector('input') as HTMLInputElement;
    expect(hint.textContent).toContain('Como aparece en la cédula');
    expect(input.getAttribute('aria-describedby')).toBe(hint.id);
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(fields[0].querySelector('.ui-field-error')).toBeNull();
  });

  it('shows the signal-forms error only after the field is touched', () => {
    const { fixture, host, fields } = setup();
    const input = fields[0].querySelector('input') as HTMLInputElement;

    host.f.name().markAsTouched();
    fixture.detectChanges();

    const error = fields[0].querySelector('.ui-field-error') as HTMLElement;
    expect(error.textContent).toContain('El nombre es requerido');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(error.id);
    expect(fields[0].querySelector('.ui-field-hint')).toBeNull();

    input.value = 'Ana';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fields[0].querySelector('.ui-field-error')).toBeNull();
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('shows an [error] string as soon as it is set', () => {
    const { fixture, host, fields } = setup();
    const textarea = fields[2].querySelector('textarea') as HTMLTextAreaElement;

    host.serverError.set('No se pudo guardar la nota');
    fixture.detectChanges();

    expect(fields[2].querySelector('.ui-field-error')?.textContent).toContain('No se pudo guardar la nota');
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
  });

  it('gives each field its own ids', () => {
    const { fields } = setup();
    const ids = Array.from(fields).map((f) => f.querySelector('input, select, textarea')?.id);
    expect(new Set(ids).size).toBe(3);
  });
});
