import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, FormField, required } from '@angular/forms/signals';
import { ComboboxOption, UiCombobox } from './combobox';
import { UiField } from './field';

const OPTIONS: ComboboxOption[] = [
  { value: 'mat', label: 'Matemáticas' },
  { value: 'esp', label: 'Español' },
  { value: 'cie', label: 'Ciencias Naturales' },
];

@Component({
  imports: [UiCombobox, UiField, FormField],
  template: `
    <ui-field label="Asignatura" [field]="form.subjectId">
      <ui-combobox [formField]="form.subjectId" [options]="options" creatable (create)="created.set($event)" />
    </ui-field>
  `,
})
class Host {
  readonly options = OPTIONS;
  readonly model = signal({ subjectId: '' });
  readonly form = form(this.model, (p) => required(p.subjectId, { message: 'Asignatura requerida' }));
  readonly created = signal('');
}

async function setup(subjectId = '') {
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.model.set({ subjectId });
  fixture.detectChanges();
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const input = root.querySelector('input') as HTMLInputElement;
  const type = async (text: string) => {
    input.value = text;
    input.dispatchEvent(new InputEvent('input', { inputType: 'insertText' }));
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const options = () => Array.from(document.querySelectorAll<HTMLElement>('.ui-combobox-option'));
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { fixture, root, input, type, options, settle, host: fixture.componentInstance };
}

describe('ui-combobox', () => {
  afterEach(() => document.querySelectorAll('.cdk-overlay-container').forEach((el) => el.remove()));

  it('is labelled by the enclosing ui-field', async () => {
    const { root, input } = await setup();
    const label = root.querySelector('label') as HTMLLabelElement;
    expect(input.id).toBeTruthy();
    expect(label.htmlFor).toBe(input.id);
    expect(root.querySelector('ui-combobox')?.hasAttribute('id')).toBe(false);
  });

  it('shows the selected option label', async () => {
    const { input } = await setup('esp');
    expect(input.value).toBe('Español');
  });

  it('filters case- and accent-insensitively and commits a click', async () => {
    const { type, options, settle, host, input } = await setup();
    await type('matematicas');
    expect(options().map((o) => o.textContent?.trim())).toEqual(['Matemáticas']);
    options()[0].click();
    await settle();
    expect(host.model().subjectId).toBe('mat');
    expect(input.value).toBe('Matemáticas');
  });

  it('offers to create an unknown option and emits the typed text', async () => {
    const { type, options, settle, host } = await setup();
    await type('  Robótica ');
    const create = options().find((o) => o.classList.contains('ui-combobox-create'));
    expect(create?.textContent).toContain('«Robótica»');
    create?.click();
    await settle();
    expect(host.created()).toBe('Robótica');
    expect(host.model().subjectId).toBe('');
  });

  it('does not offer create when the text matches an option', async () => {
    const { type, options } = await setup();
    await type('español');
    expect(options().some((o) => o.classList.contains('ui-combobox-create'))).toBe(false);
  });

  it('on blur, restores the label of unfinished text and marks the field touched', async () => {
    const { type, input, settle, root, host } = await setup('cie');
    await type('xyz');
    input.dispatchEvent(new FocusEvent('focusout'));
    await settle();
    expect(input.value).toBe('Ciencias Naturales');
    expect(host.form.subjectId().touched()).toBe(true);
    expect(root.querySelector('.ui-field-error')).toBeNull();
  });

  it('clearing the text clears the value and shows the field error once touched', async () => {
    const { type, input, settle, root, host } = await setup('cie');
    await type('');
    input.dispatchEvent(new FocusEvent('focusout'));
    await settle();
    expect(host.model().subjectId).toBe('');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(root.querySelector('.ui-field-error')?.textContent).toContain('Asignatura requerida');
  });
});
