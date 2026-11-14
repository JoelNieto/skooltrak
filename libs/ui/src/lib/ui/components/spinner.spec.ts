import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Spinner } from './spinner';

@Component({
  imports: [Spinner],
  template: `
    <div><span uiSpinner class="page"></span></div>
    <span uiSpinner size="lg" label="Cargando notas" class="text-primary labelled"></span>
    <button type="button"><span uiSpinner size="sm" class="in-button"></span> Guardando…</button>
  `,
})
class Host {}

function setup() {
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges(); // not attached to the document: the parent element is enough
  const root = fixture.nativeElement as HTMLElement;
  return (s: string) => root.querySelector(s) as HTMLElement;
}

describe('uiSpinner', () => {
  it('announces itself when standalone', () => {
    const q = setup();
    const page = q('.page');
    expect([...page.classList]).toEqual(expect.arrayContaining(['loading', 'loading-spinner', 'ui-spinner']));
    expect(page.getAttribute('role')).toBe('status');
    expect(page.getAttribute('aria-label')).toBe('Cargando');
    expect(q('.labelled').getAttribute('aria-label')).toBe('Cargando notas');
    expect(q('.labelled').classList).toContain('loading-lg');
    expect(q('.labelled').classList).toContain('text-primary');
  });

  it('is decorative inside a button', () => {
    const q = setup();
    const inButton = q('.in-button');
    expect(inButton.classList).toContain('loading-sm');
    expect(inButton.getAttribute('role')).toBeNull();
    expect(inButton.getAttribute('aria-label')).toBeNull();
    expect(inButton.getAttribute('aria-hidden')).toBe('true');
  });
});
