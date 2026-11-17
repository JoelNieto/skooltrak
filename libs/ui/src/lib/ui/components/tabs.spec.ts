import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiTab, UiTabContent, UiTabList, UiTabListVariant, UiTabPanel, UiTabs } from './tabs';

@Component({
  imports: [UiTabs, UiTabList, UiTab, UiTabPanel, UiTabContent],
  template: `
    <div uiTabs>
      <div uiTabList [(selectedTab)]="tab" [variant]="variant()" aria-label="Secciones" class="mt-2">
        <button uiTab value="grades">Calificaciones</button>
        <button uiTab value="files">Archivos</button>
        <button uiTab value="audit" disabled>Auditoría</button>
      </div>
      <div uiTabPanel value="grades">
        <ng-template uiTabContent><input class="grades-input" /></ng-template>
      </div>
      <div uiTabPanel value="files">
        <ng-template uiTabContent><p class="files-body">Lista de archivos</p></ng-template>
      </div>
      <div uiTabPanel value="audit" [preserveContent]="false">
        <ng-template uiTabContent><p class="audit-body">Registro</p></ng-template>
      </div>
    </div>
  `,
})
class Host {
  tab = signal<string | undefined>('grades');
  variant = signal<UiTabListVariant>('box');
}

function setup() {
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  const tabs = () => [...root.querySelectorAll('[role="tab"]')] as HTMLElement[];
  const panels = () => [...root.querySelectorAll('[role="tabpanel"]')] as HTMLElement[];
  return { fixture, host: fixture.componentInstance, root, tabs, panels };
}

describe('uiTabs', () => {
  it('renders an accessible tab list with the box style by default, keeping host classes', () => {
    const { root, tabs, panels } = setup();
    const list = root.querySelector('[role="tablist"]') as HTMLElement;
    expect([...list.classList]).toEqual(expect.arrayContaining(['tabs', 'ui-tab-list', 'tabs-box', 'mt-2']));
    expect(tabs()).toHaveLength(3);
    expect(tabs().map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
    expect(tabs()[0].classList).toContain('tab-active');
    expect(tabs()[0].getAttribute('aria-controls')).toBe(panels()[0].id);
    expect(panels()[0].getAttribute('aria-labelledby')).toBe(tabs()[0].id);
  });

  it('switches to the line style', () => {
    const { fixture, host, root } = setup();
    host.variant.set('line');
    fixture.detectChanges();
    const list = root.querySelector('[role="tablist"]') as HTMLElement;
    expect(list.classList).toContain('tabs-border');
    expect(list.classList).toContain('ui-tab-list-line');
    expect(list.classList).not.toContain('tabs-box');
  });

  it('only the selected panel is reachable; the others are inert', () => {
    const { panels } = setup();
    expect(panels()[0].hasAttribute('inert')).toBe(false);
    expect(panels()[1].hasAttribute('inert')).toBe(true);
    expect(panels()[2].hasAttribute('inert')).toBe(true);
  });

  it('selects on click, updates the two-way binding and renders lazy content on demand', () => {
    const { fixture, host, root, tabs, panels } = setup();
    expect(root.querySelector('.files-body')).toBeNull();
    tabs()[1].click();
    fixture.detectChanges();
    expect(host.tab()).toBe('files');
    expect(tabs()[1].getAttribute('aria-selected')).toBe('true');
    expect(panels()[1].hasAttribute('inert')).toBe(false);
    expect(root.querySelector('.files-body')?.textContent).toContain('Lista de archivos');
  });

  it('follows the bound value when it changes from code', () => {
    const { fixture, host, tabs } = setup();
    host.tab.set('files');
    fixture.detectChanges();
    expect(tabs()[1].getAttribute('aria-selected')).toBe('true');
    expect(tabs()[0].classList).not.toContain('tab-active');
  });

  it('keeps a visited panel rendered (form input survives) unless preserveContent is false', () => {
    const { fixture, host, root } = setup();
    (root.querySelector('.grades-input') as HTMLInputElement).value = 'borrador';
    host.tab.set('files');
    fixture.detectChanges();
    host.tab.set('grades');
    fixture.detectChanges();
    expect((root.querySelector('.grades-input') as HTMLInputElement).value).toBe('borrador');
    expect(root.querySelector('.files-body')).not.toBeNull();
  });

  it('destroys a panel with preserveContent=false when its tab closes', () => {
    const { fixture, host, root } = setup();
    host.tab.set('audit');
    fixture.detectChanges();
    expect(root.querySelector('.audit-body')).not.toBeNull();
    host.tab.set('grades');
    fixture.detectChanges();
    expect(root.querySelector('.audit-body')).toBeNull();
  });

  it('marks disabled tabs and does not select them', () => {
    const { fixture, host, tabs } = setup();
    const audit = tabs()[2];
    expect(audit.getAttribute('aria-disabled')).toBe('true');
    expect(audit.classList).toContain('tab-disabled');
    audit.click();
    fixture.detectChanges();
    expect(host.tab()).toBe('grades');
  });

  it('button tabs are type="button", so they never submit an enclosing form', () => {
    const { tabs } = setup();
    expect(tabs().map((t) => t.getAttribute('type'))).toEqual(['button', 'button', 'button']);
  });

  it('moves between tabs with the arrow keys', () => {
    const { fixture, host, tabs } = setup();
    tabs()[0].focus();
    tabs()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(host.tab()).toBe('files');
  });
});
