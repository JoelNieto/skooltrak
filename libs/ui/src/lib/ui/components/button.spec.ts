import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';
import { Button, ButtonSize, ButtonVariant } from './button';

@Component({
  imports: [Button, RouterLink],
  template: `
    <button
      uiButton
      id="btn"
      [variant]="variant()"
      [size]="size()"
      [iconOnly]="iconOnly()"
      [loading]="loading()"
      (click)="clicks = clicks + 1"
    >
      Guardar
    </button>
    <a uiButton id="link" variant="ghost" size="sm" routerLink="/cursos">Ver cursos</a>
    <button uiButton id="default">Cancelar</button>
  `,
})
class Host {
  variant = signal<ButtonVariant>('primary');
  size = signal<ButtonSize>('md');
  iconOnly = signal(false);
  loading = signal(false);
  clicks = 0;
}

function setup() {
  TestBed.configureTestingModule({ imports: [Host], providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const el = (id: string) => fixture.debugElement.query(By.css(`#${id}`)).nativeElement as HTMLElement;
  return { fixture, host: fixture.componentInstance, el };
}

describe('Button (uiButton)', () => {
  it.each<[ButtonVariant, string[], string[]]>([
    ['primary', ['btn', 'btn-primary', 'ui-btn-primary'], ['btn-ghost', 'ui-btn-secondary']],
    ['secondary', ['btn', 'ui-btn-secondary'], ['btn-primary', 'btn-ghost']],
    ['ghost', ['btn', 'btn-ghost'], ['btn-primary', 'ui-btn-secondary']],
    ['danger', ['btn', 'btn-error', 'btn-outline'], ['btn-primary', 'ui-btn-secondary']],
  ])('maps variant %s to DaisyUI classes', (variant, present, absent) => {
    const { fixture, host, el } = setup();
    host.variant.set(variant);
    fixture.detectChanges();
    const classes = el('btn').classList;
    present.forEach((c) => expect(classes).toContain(c));
    absent.forEach((c) => expect(classes).not.toContain(c));
  });

  it.each<[ButtonSize, string | null]>([
    ['sm', 'btn-sm'],
    ['md', null],
    ['lg', 'btn-lg'],
  ])('maps size %s', (size, cls) => {
    const { fixture, host, el } = setup();
    host.size.set(size);
    fixture.detectChanges();
    const classes = el('btn').classList;
    expect(classes.contains('btn-sm')).toBe(cls === 'btn-sm');
    expect(classes.contains('btn-lg')).toBe(cls === 'btn-lg');
  });

  it('defaults to a medium secondary button', () => {
    const { el } = setup();
    const classes = el('default').classList;
    expect(classes).toContain('ui-btn-secondary');
    expect(classes).not.toContain('btn-sm');
    expect(classes).not.toContain('btn-lg');
  });

  it('makes icon-only buttons circular', () => {
    const { fixture, host, el } = setup();
    host.iconOnly.set(true);
    fixture.detectChanges();
    expect(el('btn').classList).toContain('btn-circle');
  });

  it('shows a spinner, sets aria-busy and blocks pointer events while loading', () => {
    const { fixture, host, el } = setup();
    expect(el('btn').querySelector('.loading')).toBeNull();
    expect(el('btn').getAttribute('aria-busy')).toBeNull();

    host.loading.set(true);
    fixture.detectChanges();

    expect(el('btn').querySelector('.loading-spinner')).not.toBeNull();
    expect(el('btn').getAttribute('aria-busy')).toBe('true');
    expect(el('btn').classList).toContain('ui-btn-loading');
    expect(el('btn').textContent).toContain('Guardar');
  });

  it('keeps native behaviour on the host element', () => {
    const { host, el } = setup();
    el('btn').click();
    expect(host.clicks).toBe(1);

    const link = el('link');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/cursos');
    expect(link.classList).toContain('btn-ghost');
    expect(link.classList).toContain('btn-sm');
  });
});
