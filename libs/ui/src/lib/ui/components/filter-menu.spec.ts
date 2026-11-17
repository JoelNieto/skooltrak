import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiFilterMenu } from './filter-menu';

@Component({
  imports: [UiFilterMenu],
  template: `
    <ui-filter-menu [activeCount]="count()" [(open)]="open" (clear)="cleared = cleared + 1">
      <label><input type="checkbox" class="opt" /> Al día</label>
    </ui-filter-menu>
    <button type="button" class="outside">fuera</button>
  `,
})
class Host {
  count = signal(0);
  open = signal(false);
  cleared = 0;
}

function setup() {
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  const trigger = root.querySelector('.ui-filter-menu-trigger') as HTMLButtonElement;
  // The panel renders in CDK's overlay container, outside the fixture.
  const panel = () => document.querySelector('.ui-filter-panel') as HTMLElement | null;
  return { fixture, host: fixture.componentInstance, root, trigger, panel };
}

describe('ui-filter-menu', () => {
  afterEach(() => document.querySelectorAll('.cdk-overlay-container').forEach((c) => (c.innerHTML = '')));

  it('opens a labelled dialog with the projected filters and reflects it on the button', () => {
    const { fixture, host, trigger, panel } = setup();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(panel()).toBeNull();
    trigger.click();
    fixture.detectChanges();
    expect(host.open()).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(panel()?.getAttribute('role')).toBe('dialog');
    expect(panel()?.getAttribute('aria-label')).toBe('Filtros');
    expect(trigger.getAttribute('aria-controls')).toBe(panel()?.id);
    expect(panel()?.querySelector('.opt')).not.toBeNull();
  });

  it('shows the active count, and Limpiar is enabled only when filters are on', () => {
    const { fixture, host, trigger, panel } = setup();
    expect(trigger.querySelector('.ui-filter-menu-count')).toBeNull();
    host.open.set(true);
    fixture.detectChanges();
    const clear = () =>
      [...(panel()?.querySelectorAll('button') ?? [])].find((b) =>
        b.textContent?.includes('Limpiar'),
      ) as HTMLButtonElement;
    expect(clear().disabled).toBe(true);
    host.count.set(3);
    fixture.detectChanges();
    expect(trigger.querySelector('.ui-filter-menu-count')?.textContent).toBe('3');
    expect(trigger.classList).toContain('ui-filter-menu-on');
    expect(clear().disabled).toBe(false);
    clear().click();
    expect(host.cleared).toBe(1);
  });

  it('closes with Listo and with Escape', () => {
    const { fixture, host, panel } = setup();
    host.open.set(true);
    fixture.detectChanges();
    const done = [...(panel()?.querySelectorAll('button') ?? [])].find((b) =>
      b.textContent?.includes('Listo'),
    ) as HTMLButtonElement;
    done.click();
    fixture.detectChanges();
    expect(host.open()).toBe(false);

    host.open.set(true);
    fixture.detectChanges();
    panel()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(host.open()).toBe(false);
  });

  it('closes on a click outside, but the button itself only toggles', () => {
    const { fixture, host, root, trigger } = setup();
    trigger.click();
    fixture.detectChanges();
    trigger.click();
    fixture.detectChanges();
    expect(host.open()).toBe(false);
    trigger.click();
    fixture.detectChanges();
    (root.querySelector('.outside') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.open()).toBe(false);
  });
});
